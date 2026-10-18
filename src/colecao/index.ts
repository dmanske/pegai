// "Baixar coleção": na página de uma coleção salva, um botão baixa TODOS os posts dela para
// Downloads/Pegai Downloads/Coleções/<nome da coleção>/<perfil>/, com o mesmo nome de arquivo dos avulsos.
import { criarPilula, type Pilula } from "../botao/pilula.ts";
import { arquivosExistem, baixarPost, pastaDaColecao } from "../download/cliente.ts";
import { jaBaixado } from "../historico/index.ts";
import { buscarPost, ErroIg } from "../midia/api.ts";
import { CONFIG } from "../shared/config.ts";
import { extensaoRecarregada, MSG_EXTENSAO_RECARREGADA } from "../shared/erros.ts";
import { colecaoDaUrl, postsDaColecao } from "./api.ts";
import type { ResumoColecao } from "./types/index.ts";

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

let montada: { id: string; pilula: Pilula } | null = null;
let rodando = false;
let pedirParada = false;

/** Nome da coleção como aparece na página ("Receitas"); reserva: o slug da URL. */
function nomeDaColecao(slug: string): string {
  const titulo = document.querySelector("main h3")?.textContent?.trim();
  if (titulo) return titulo;
  const s = decodeURIComponent(slug).replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function baixarColecao(id: string, nome: string, p: Pilula): Promise<ResumoColecao> {
  const r: ResumoColecao = { total: 0, baixados: 0, pulados: 0, falhas: [], parado: false };
  p.mudar("ocupado", "Listando os posts…", "Clique de novo para parar.");
  // parar também vale durante a listagem (antes ela ia até o fim, que pode levar minutos)
  const posts = await postsDaColecao(
    id,
    (n) => { if (!pedirParada) p.mudar("ocupado", `Listando os posts… ${n}`, "Clique de novo para parar."); },
    () => pedirParada,
  );
  r.total = posts.length;
  for (const [i, post] of posts.entries()) {
    if (pedirParada) { r.parado = true; break; }
    p.mudar("ocupado", `Baixando ${i + 1} de ${posts.length}…`, `@${post.autor} · clique de novo para parar.`);
    // já está NESTA coleção E os arquivos continuam no disco: pula (se a pessoa apagou, baixa de novo)
    const reg = await jaBaixado(post.codigo);
    if (reg?.colecao === nome && (await arquivosExistem(reg))) { r.pulados++; continue; }
    try {
      await baixarPost(post, { colecao: nome, rebuscar: () => buscarPost(post.codigo, post.origem === "reel" ? "reel" : "post") });
      r.baixados++;
    } catch (e) {
      r.falhas.push({ codigo: post.codigo, erro: e instanceof Error ? e.message : String(e) });
      if (e instanceof ErroIg && e.status === 429) await esperar(CONFIG.esperaLimiteColecao);
    }
    await esperar(CONFIG.pausaEntrePostsColecao);
  }
  return r;
}

async function aoClicar() {
  const pag = colecaoDaUrl();
  if (!pag || !montada) return;
  const p = montada.pilula;
  if (rodando) { pedirParada = true; p.mudar("ocupado", "Parando depois deste post…"); return; }
  rodando = true; pedirParada = false;
  const nome = nomeDaColecao(pag.slug);
  try {
    const r = await baixarColecao(pag.id, nome, p);
    const partes = [
      `em Downloads/${await pastaDaColecao(nome)}`,
      r.pulados ? `${r.pulados} já ${r.pulados > 1 ? "estavam" : "estava"}` : "",
      r.falhas.length ? `${r.falhas.length} com erro (${r.falhas.map((f) => f.codigo).join(", ")})` : "",
    ].filter(Boolean).join(" · ");
    if (r.parado && !r.baixados && !r.pulados) p.mudar("normal", "Baixar coleção", "Parado antes de baixar. Clique para começar de novo.");
    else if (r.parado) p.mudar("normal", `Parado: ${r.baixados} de ${r.total} baixados`, partes + " · clique para continuar");
    else if (r.falhas.length && !r.baixados && !r.pulados) p.mudar("erro", "Não consegui baixar a coleção", r.falhas[0].erro);
    else p.mudar("pronto", `Coleção salva: ${r.baixados + r.pulados} de ${r.total} posts`, partes);
  } catch (e) {
    console.warn("[Pegaí] coleção", e);
    const msg = extensaoRecarregada(e) ? MSG_EXTENSAO_RECARREGADA
      : e instanceof ErroIg && e.status === 429 ? "O Instagram limitou os pedidos. Espere alguns minutos e tente de novo."
      : e instanceof Error ? e.message : String(e);
    p.mudar("erro", "Não consegui listar a coleção", msg);
  } finally {
    rodando = false; pedirParada = false;
  }
}

/** Chamado pelo observador da página: põe o botão abaixo do título da coleção (uma vez por coleção). */
export function verificarColecao(): void {
  const pag = colecaoDaUrl();
  if (!pag) return;
  if (montada?.id === pag.id && montada.pilula.host.isConnected) return;
  const titulo = document.querySelector("main h3");
  if (!titulo?.parentElement) return; // página ainda carregando
  if (rodando && montada) { titulo.parentElement.insertBefore(montada.pilula.host, titulo.nextSibling); return; }
  const pilula = criarPilula(aoClicar);
  void pastaDaColecao(nomeDaColecao(pag.slug)).then((p) => pilula.mudar("normal", "Baixar coleção", `Salva tudo em Downloads/${p}`));
  pilula.mudar("normal", "Baixar coleção");
  titulo.parentElement.insertBefore(pilula.host, titulo.nextSibling);
  montada = { id: pag.id, pilula };
}
