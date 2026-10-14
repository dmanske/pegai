// Service worker: baixa UM arquivo por pedido e só responde quando o Chrome termina
// (downloads.onChanged → complete) ou falha.
import type { MotivoFalha, PedidoFundo, RespostaFundo } from "../shared/types.ts";

/** Erros do chrome.downloads → o que o content script deve fazer. */
function motivoDe(erro: string): MotivoFalha {
  if (erro === "USER_CANCELED") return "pergunta-onde"; // a janela "salvar como" apareceu e foi fechada
  if (/^SERVER_(FORBIDDEN|UNAUTHORIZED|BAD_CONTENT|NO_RANGE)$/.test(erro)) return "expirado";
  if (/^(NETWORK_|SERVER_FAILED|SERVER_UNREACHABLE)/.test(erro)) return "passageiro";
  return "outro";
}

function esperarFim(id: number): Promise<RespostaFundo> {
  return new Promise((resolve) => {
    const ouvir = (d: chrome.downloads.DownloadDelta) => {
      if (d.id !== id) return;
      if (d.state?.current === "complete") {
        chrome.downloads.onChanged.removeListener(ouvir);
        chrome.downloads.search({ id }, ([item]) => resolve({ ok: true, arquivo: item?.filename ?? "" }));
      } else if (d.state?.current === "interrupted") {
        chrome.downloads.onChanged.removeListener(ouvir);
        const erro = d.error?.current ?? "INTERROMPIDO";
        resolve({ ok: false, motivo: motivoDe(erro), erro });
      }
    };
    chrome.downloads.onChanged.addListener(ouvir);
    // pode já ter terminado antes de o ouvinte entrar (arquivo pequeno)
    chrome.downloads.search({ id }, ([item]) => {
      if (item?.state === "complete") { chrome.downloads.onChanged.removeListener(ouvir); resolve({ ok: true, arquivo: item.filename }); }
      else if (item?.state === "interrupted") {
        chrome.downloads.onChanged.removeListener(ouvir);
        resolve({ ok: false, motivo: motivoDe(item.error ?? ""), erro: item.error ?? "INTERROMPIDO" });
      }
    });
  });
}

async function baixar(url: string, caminho: string): Promise<RespostaFundo> {
  try {
    // overwrite: baixar de novo o mesmo post não cria "(1)"
    const id = await chrome.downloads.download({ url, filename: caminho, saveAs: false, conflictAction: "overwrite" });
    return await esperarFim(id);
  } catch (e) {
    return { ok: false, motivo: "outro", erro: e instanceof Error ? e.message : String(e) };
  }
}

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Alguma mídia do post ("… [<código>].mp4" ou "… [<código>] 01.jpg") ainda está no disco, nesta
 * pasta? O Chrome não vigia arquivos apagados: um search() DISPARA a conferência e o resultado vem
 * atualizado num 2º search(). Sem registro no histórico do Chrome (a pessoa limpou a lista) = não
 * existe → baixa de novo.
 */
async function existe(pasta: string, codigo: string): Promise<boolean> {
  const sep = "[\\\\/]";
  const consulta = { filenameRegex: `(^|${sep})${escapar(pasta).replace(/\//g, sep)}${sep}[^\\\\/]*\\[${escapar(codigo)}\\]( \\d{2})?\\.(mp4|jpg)$` };
  await chrome.downloads.search(consulta);
  await new Promise((r) => setTimeout(r, 400));
  return (await chrome.downloads.search(consulta)).some((d) => d.state === "complete" && d.exists);
}

chrome.runtime.onMessage.addListener((pedido: PedidoFundo, _remetente, responder) => {
  if (pedido?.tipo === "existe") {
    existe(pedido.pasta, pedido.codigo).then((sim) => responder({ existe: sim }), () => responder({ existe: false }));
    return true;
  }
  if (pedido?.tipo === "baixar-arquivo") {
    baixar(pedido.url, pedido.caminho).then(responder);
    return true; // resposta assíncrona
  }
  if (pedido?.tipo === "baixar-texto") {
    const url = `data:${pedido.mime};charset=utf-8,` + encodeURIComponent(pedido.texto);
    baixar(url, pedido.caminho).then(responder);
    return true;
  }
  return false;
});
