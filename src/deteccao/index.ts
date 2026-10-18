// Content script (mundo isolado): observa a página, põe um botão em cada mídia e cuida do
// clique — buscar o post DESTA mídia, escolher o slide, baixar e mostrar o resultado.
import { criarBotao, type Botao } from "../botao/index.ts";
import { verificarColecao } from "../colecao/index.ts";
import { arquivosExistem, baixarPost, ErroDownload, pastaDoPost } from "../download/cliente.ts";
import { aoMudar, jaBaixado } from "../historico/index.ts";
import { buscarPost, buscarStory, ErroIg } from "../midia/api.ts";
import { extensaoRecarregada, MSG_EXTENSAO_RECARREGADA } from "../shared/erros.ts";
import type { Post } from "../shared/types.ts";
import { novosAlvos, slideVisivel } from "./alvos.ts";
import type { Alvo, Referencia } from "./types/index.ts";

interface Montado { alvo: Alvo; botao: Botao; carrossel: boolean; atualizarTodos: () => void }
const montados = new Set<Montado>();
let contador = 0;

const dataCurta = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

async function atualizarJaBaixado(m: Montado) {
  const codigo = m.alvo.codigoRapido();
  const reg = codigo ? await jaBaixado(codigo) : null;
  // só marca se os arquivos ainda estão no disco (a pessoa pode ter apagado)
  const existe = reg ? await arquivosExistem(reg) : false;
  m.botao.marcarJaBaixado(reg && existe ? `Já baixado em ${dataCurta(reg.baixadoEm)} — clique para baixar de novo` : null);
}

function buscar(ref: Referencia): Promise<Post> {
  return ref.tipo === "story" ? buscarStory(ref.usuario, ref.id, ref.pista) : buscarPost(ref.codigo, ref.origem);
}

function mensagemDeErro(e: unknown): string {
  if (extensaoRecarregada(e)) return MSG_EXTENSAO_RECARREGADA;
  if (e instanceof ErroIg && e.status === 429) return "O Instagram limitou os pedidos. Espere 1–2 minutos e tente de novo.";
  if (e instanceof ErroIg || e instanceof ErroDownload) return e.message;
  return "Algo deu errado: " + (e instanceof Error ? e.message : String(e));
}

async function aoClicar(m: Montado, todos: boolean) {
  const { alvo, botao } = m;
  botao.mudar("baixando", "Procurando o post…");
  try {
    const ref = await alvo.resolver();
    if (!ref) {
      // anúncio ("Patrocinado") não tem link de post
      const anuncio = alvo.tipo === "artigo" && /\b(Patrocinado|Sponsored)\b/.test(alvo.caixa.innerText.slice(0, 600));
      botao.mudar("erro", anuncio ? "Anúncio: o Instagram não dá o link deste post para baixar." : "Não consegui saber qual é este post. Abra o post e tente de novo.");
      return;
    }
    const post = await buscar(ref);
    m.carrossel = post.carrossel;
    m.atualizarTodos();

    let indices: number[] | undefined;
    let aviso = "";
    if (post.carrossel && !todos) {
      const i = slideVisivel(alvo, post);
      if (i === null) aviso = " (não deu para saber o slide da tela: baixei todos)";
      else indices = [i];
    }
    const n = await baixarPost(post, {
      indices,
      rebuscar: () => buscar(ref),
      aoProgredir: ({ feitos, total }) => botao.mudar("baixando", total > 1 ? `Baixando ${Math.min(feitos + 1, total)} de ${total}…` : "Baixando…"),
    });
    const pasta = await pastaDoPost(post.autor);
    botao.mudar("pronto", `Salvo: ${n} arquivo${n > 1 ? "s" : ""} em Downloads/${pasta}${aviso}`);
    await atualizarJaBaixado(m);
  } catch (e) {
    console.warn("[Pegaí]", e);
    botao.mudar("erro", mensagemDeErro(e));
  }
}

function montar(alvo: Alvo) {
  const m: Montado = { alvo, botao: undefined as unknown as Botao, carrossel: false, atualizarTodos: () => {} };
  // carrossel: a API confirmou (depois de um clique) ou a página mostra uma lista com 2+ slides
  const ehCarrossel = () => m.carrossel || (alvo.tipo === "artigo" && !!alvo.caixa.querySelector("ul li ~ li img, ul li ~ li video"));
  m.botao = criarBotao({ carrossel: ehCarrossel, aoClicar: (todos) => aoClicar(m, todos) });
  m.atualizarTodos = () => m.botao.mostrarTodos(ehCarrossel());
  const host = m.botao.host;
  // número fixo ligando botão e mídia (diagnóstico: o botão pode mudar de pai)
  const numero = String(++contador);
  host.setAttribute("data-ig-grabber-botao", numero);
  alvo.caixa.setAttribute("data-ig-grabber-n", numero);

  // o botão fica no canto superior direito DA MÍDIA, medido em relação a quem o posiciona de
  // fato (offsetParent) — assim não precisamos mudar o "position" de nada do Instagram
  const posicionar = () => {
    const midia = alvo.midia()?.getBoundingClientRect();
    const ref = (host.offsetParent as HTMLElement | null)?.getBoundingClientRect();
    if (!midia || !ref) return;
    host.style.right = "auto";
    host.style.top = `${midia.top - ref.top + 10}px`;
    host.style.left = `${midia.right - ref.left - 36 - 10}px`;
  };

  // No post aberto (modal) e no player do Reels o Instagram põe camadas por cima da mídia. Se o botão
  // não for o elemento do topo no seu ponto, ele sobe para o ancestral que contém a camada e
  // entra DEPOIS dela (mesmo z-index alto, ordem posterior = por cima).
  const garantirNoTopo = () => {
    for (let tentativa = 0; tentativa < 6; tentativa++) {
      const b = host.getBoundingClientRect();
      if (!b.width) return;
      const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      if (!el || el === host) return;
      let comum: Element | null = el;
      while (comum && !comum.contains(host)) comum = comum.parentElement;
      if (!comum || comum === host.parentElement) return; // camada irmã: não há onde subir
      comum.appendChild(host);
      posicionar();
    }
  };

  const preparar = () => { posicionar(); garantirNoTopo(); m.atualizarTodos(); };
  alvo.escopo.addEventListener("mouseenter", () => { preparar(); m.botao.mostrar(true); });
  alvo.escopo.addEventListener("mouseleave", () => m.botao.mostrar(false));
  alvo.caixa.appendChild(host);
  posicionar();
  requestAnimationFrame(preparar);
  // ao entrar na tela (rolar o feed, próximo reel), já deixa o botão no lugar e por cima
  new IntersectionObserver((ents) => {
    if (ents.some((e) => e.isIntersecting)) requestAnimationFrame(preparar);
  }, { threshold: 0.5 }).observe(alvo.caixa);
  // o botão fica SEMPRE à vista: acompanha a mídia quando ela carrega ou a janela muda de tamanho
  let pendente = false;
  new ResizeObserver(() => {
    if (pendente) return;
    pendente = true;
    requestAnimationFrame(() => { pendente = false; preparar(); });
  }).observe(alvo.caixa);
  montados.add(m);
  void atualizarJaBaixado(m);
}

// ---- observador único: procura mídias novas quando a página muda ----
let agendado = false;
function varrer() {
  agendado = false;
  for (const m of montados) if (!m.alvo.caixa.isConnected) montados.delete(m);
  for (const alvo of novosAlvos()) montar(alvo);
  verificarColecao(); // página de coleção salva: botão "Baixar coleção"
}
function agendar() {
  if (agendado) return;
  agendado = true;
  setTimeout(varrer, 250);
}

new MutationObserver(agendar).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("popstate", agendar);
aoMudar(() => { for (const m of montados) void atualizarJaBaixado(m); });
agendar();
