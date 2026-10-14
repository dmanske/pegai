// Lado do content script: baixa um post arquivo por arquivo, pedindo ao service worker,
// com novas tentativas e link renovado. Onde salva (dentro de Downloads):
//   Pegai/<perfil>/<data> <começo da legenda> [<código>][ NN].mp4|jpg  +  ….txt (legenda)
//   Pegai/Coleções/<nome da coleção>/<perfil>/…                       (botão "Baixar coleção")
// O código do post fica no nome entre colchetes: nomes nunca repetem, dá para achar o original
// (instagram.com/p/<código>) e é por ele que a extensão sabe o que já foi baixado.
import { CONFIG } from "../shared/config.ts";
import type { Midia, PedidoFundo, Post, RegistroHistorico, RespostaExiste, RespostaFundo } from "../shared/types.ts";
import { pastaBase, registrar } from "../historico/index.ts";

/** Erro com texto pronto para mostrar no botão. */
export class ErroDownload extends Error {}

export interface Progresso { feitos: number; total: number }

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Nome legível de pasta ou arquivo: mantém acentos e espaços, tira o que o Windows/Mac não aceitam. */
export const nomeLegivel = (s: string, reserva = "x") =>
  String(s || "").normalize("NFC")
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ").trim()
    .replace(/^[.\s]+|[.\s]+$/g, "") || reserva;

/** Pasta do perfil (nome de usuário do Instagram: letras, números, ponto e _). */
const pastaPerfil = (autor: string) => String(autor || "").replace(/[^\w.-]+/g, "_").replace(/^\.+/, "") || "perfil";

/** "Bolo de cenoura fofinho 🍲 #receita" → "Bolo de cenoura fofinho" (até ~50 letras). */
function tituloDaLegenda(legenda: string): string {
  const linha = (legenda || "").split("\n").map((l) => l.trim()).find((l) => l.replace(/[#@]\S+/g, "").trim()) ?? "";
  const limpo = linha
    .replace(/[#@]\S+/g, " ")                              // hashtags e menções
    .replace(/\p{Extended_Pictographic}|\p{Emoji_Modifier}|[‍️]/gu, " ") // emojis
    .replace(/[<>:"/\\|?*\u0000-\u001f[\]]+/g, " ")         // proibidos em arquivo (e os colchetes do código)
    .replace(/\s+/g, " ").trim().replace(/[.,;:!\-–—\s]+$/u, "");
  let titulo = limpo;
  if (titulo.length > 50) {
    const corte = titulo.slice(0, 50);
    const espaco = corte.lastIndexOf(" ");
    titulo = (espaco > 25 ? corte.slice(0, espaco) : corte).replace(/[.,;:!\-–—\s]+$/u, "");
  }
  // não termina em palavra solta: "…impecáveis e uma" → "…impecáveis"
  const SOLTAS = /\s+(e|ou|de|da|do|das|dos|a|o|as|os|um|uma|uns|umas|com|sem|para|pra|por|em|no|na|nos|nas|que|se|ao|à)$/iu;
  while (SOLTAS.test(titulo)) titulo = titulo.replace(SOLTAS, "").replace(/[.,;:!\-–—\s]+$/u, "");
  return titulo;
}

/** "2026-10-11 Bolo de cenoura fofinho [CxYz123AbcD]" */
export function nomeDoPost(post: Post): string {
  const data = (post.postadoEm ?? new Date().toISOString()).slice(0, 10);
  const titulo = tituloDaLegenda(post.legenda) || `${post.origem === "story" ? "story" : "post"} de @${post.autor}`;
  return nomeLegivel(`${data} ${titulo} [${post.codigo}]`);
}

function pedirFundo(p: PedidoFundo): Promise<RespostaFundo> {
  return chrome.runtime.sendMessage(p);
}

/** Os arquivos do post ainda estão no disco? (o "já baixado" não vale se a pessoa apagou) */
export async function arquivosExistem(reg: RegistroHistorico): Promise<boolean> {
  if (!reg.pasta) return false;
  try { return ((await chrome.runtime.sendMessage({ tipo: "existe", pasta: reg.pasta, codigo: reg.codigo } satisfies PedidoFundo)) as RespostaExiste).existe; }
  catch { return false; }
}

const AJUDA_PERGUNTA = "O Chrome está perguntando onde salvar. Desligue em chrome://settings/downloads → \"Perguntar onde salvar cada arquivo\".";

/** Baixa uma mídia; em link expirado chama `renovar` para pegar a URL nova do mesmo slide. */
async function baixarMidia(m: Midia, caminho: string, renovar: () => Promise<Midia | null>): Promise<void> {
  let url = m.url;
  let renovou = false;
  for (let tentativa = 0; ; tentativa++) {
    const r = await pedirFundo({ tipo: "baixar-arquivo", url, caminho });
    if (r.ok) return;
    if (r.motivo === "pergunta-onde") throw new ErroDownload(AJUDA_PERGUNTA);
    if (r.motivo === "expirado" && !renovou) {
      renovou = true;
      const nova = await renovar();
      if (nova) { url = nova.url; continue; }
    }
    if ((r.motivo === "passageiro" || r.motivo === "expirado") && tentativa < CONFIG.esperasNovaTentativa.length) {
      await esperar(CONFIG.esperasNovaTentativa[tentativa]);
      continue;
    }
    throw new ErroDownload(`Falhou ao salvar o arquivo (${r.erro})`);
  }
}

export interface OpcoesDownload {
  /** Baixar só estes slides (índices do carrossel). Sem isso: todos. */
  indices?: number[];
  aoProgredir?: (p: Progresso) => void;
  /** Busca o post de novo (link novo do CDN). */
  rebuscar: () => Promise<Post>;
  /** Coleção salva: vai para Pegai/Coleções/<nome da coleção>/. */
  colecao?: string;
}

/** Pasta (relativa ao Downloads) de uma coleção: "Pegai/Coleções/Receitas". */
export async function pastaDaColecao(colecao: string): Promise<string> {
  return `${nomeLegivel(await pastaBase(), CONFIG.pastaBasePadrao)}/${CONFIG.pastaColecoes}/${nomeLegivel(colecao, "Coleção")}`;
}

/** Pasta (relativa ao Downloads) onde um post fica: "Pegai/<perfil>" ou "<pasta da coleção>/<perfil>". */
export async function pastaDoPost(autor: string, colecao?: string): Promise<string> {
  const raiz = colecao ? await pastaDaColecao(colecao) : nomeLegivel(await pastaBase(), CONFIG.pastaBasePadrao);
  return `${raiz}/${pastaPerfil(autor)}`;
}

export async function baixarPost(post: Post, op: OpcoesDownload): Promise<number> {
  const pasta = await pastaDoPost(post.autor, op.colecao);
  const nome = nomeDoPost(post);
  const escolhidas = op.indices ? post.midias.filter((m) => op.indices!.includes(m.indice)) : post.midias;
  if (!escolhidas.length) throw new ErroDownload("Este post não tem mídia para baixar");

  const total = escolhidas.length;
  op.aoProgredir?.({ feitos: 0, total });
  for (const [i, m] of escolhidas.entries()) {
    // número pela posição no carrossel inteiro (o slide 3 é sempre 03, baixando um ou todos)
    const sufixo = post.midias.length > 1 ? ` ${String(m.indice + 1).padStart(2, "0")}` : "";
    await baixarMidia(m, `${pasta}/${nome}${sufixo}.${m.ext}`, async () => {
      const novo = await op.rebuscar();
      return novo.midias.find((x) => x.indice === m.indice) ?? null;
    });
    op.aoProgredir?.({ feitos: i + 1, total });
  }

  // a legenda completa, ao lado da mídia
  if (post.legenda) await pedirFundo({ tipo: "baixar-texto", texto: post.legenda, caminho: `${pasta}/${nome}.txt`, mime: "text/plain" });

  await registrar({
    codigo: post.codigo, autor: post.autor, url: post.url, origem: post.origem,
    baixadoEm: new Date().toISOString(), arquivos: total,
    miniatura: post.miniatura ?? escolhidas.find((m) => m.ext === "jpg")?.url ?? null,
    colecao: op.colecao,
    pasta,
  });
  return total;
}
