// Acha as mídias da tela e monta um Alvo para cada uma.
import { CONFIG } from "../shared/config.ts";
import type { Post } from "../shared/types.ts";
import { nomeDoArquivo } from "../midia/versoes.ts";
import { codigoDaUrl, codigoDosLinks, storyDaUrl } from "./codigos.ts";
import { codigoPeloReact } from "./pagina.ts";
import type { Alvo, Referencia } from "./types/index.ts";

const visivel = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

/**
 * A maior <img>/<video> dentro de `raiz` (a mídia do post, não avatar nem ícone), contando só a parte que fica
 * DENTRO da raiz: do 2º slide em diante o carrossel deixa o anterior escondido ao lado, do mesmo tamanho e antes
 * na página — sem isso o botão ia para fora da foto e "baixar este slide" baixava o slide anterior.
 */
function maiorMidia(raiz: Element): HTMLElement | null {
  const c = raiz.getBoundingClientRect();
  let melhor: HTMLElement | null = null, area = 0;
  for (const el of raiz.querySelectorAll<HTMLElement>("img, video")) {
    const r = el.getBoundingClientRect();
    if (r.height < CONFIG.alturaMinimaMidia) continue;
    const dentro = Math.max(0, Math.min(r.right, c.right) - Math.max(r.left, c.left)) *
      Math.max(0, Math.min(r.bottom, c.bottom) - Math.max(r.top, c.top));
    if (dentro > area) { area = dentro; melhor = el; }
  }
  return melhor;
}

/** Fração do elemento que está dentro da janela (0 a 1). */
function fracaoVisivel(el: Element): number {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return 0;
  const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
  const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
  return (w * h) / (r.width * r.height);
}

// ---------------- post do feed, post aberto (modal/página) e reel em página de post ----------------
function alvoArtigo(artigo: HTMLElement): Alvo {
  const noModal = () => !!artigo.closest('[role="dialog"]');
  const ehPaginaDoPost = () => !!codigoDaUrl() && document.querySelectorAll("main article").length === 1 && !!artigo.closest("main");

  const codigo = (): { codigo: string; origem: "post" | "reel"; fonte: "url" | "links-do-post" } | null => {
    // post aberto: a URL é dele (o modal troca a URL)
    if (noModal() || ehPaginaDoPost()) { const u = codigoDaUrl(); if (u) return { ...u, fonte: "url" }; }
    const l = codigoDosLinks(artigo);
    return l ? { ...l, fonte: "links-do-post" } : null;
  };

  return {
    tipo: "artigo",
    caixa: artigo,
    escopo: artigo,
    midia: () => maiorMidia(artigo),
    codigoRapido: () => codigo()?.codigo ?? null,
    resolver: async (): Promise<Referencia | null> => {
      const c = codigo();
      if (c) return { tipo: "post", codigo: c.codigo, origem: c.origem, fonte: c.fonte };
      const m = maiorMidia(artigo);
      const r = m ? await codigoPeloReact(m) : null;
      return r ? { tipo: "post", codigo: r, origem: "post", fonte: "react-da-midia" } : null;
    },
  };
}

// ---------------- player de reel fora de <article> (aba Reels) ----------------
function alvoPlayer(video: HTMLVideoElement, caixa: HTMLElement): Alvo {
  // o menor ancestral que só tem ESTE vídeo: os links dele são deste reel
  const doPlayer = () => {
    let el: HTMLElement | null = caixa;
    for (let i = 0; el && i < 8; i++, el = el.parentElement) {
      if (el.querySelectorAll("video").length > 1) break;
      const l = codigoDosLinks(el);
      if (l) return l;
    }
    return null;
  };
  // é o vídeo que está na tela agora? (então a URL /reels/<código>/ é dele)
  const ehOAtual = () => {
    const videos = [...document.querySelectorAll("video")].filter(visivel);
    const melhor = videos.sort((a, b) => fracaoVisivel(b) - fracaoVisivel(a))[0];
    return melhor === video && fracaoVisivel(video) >= 0.6;
  };
  return {
    tipo: "player",
    caixa,
    escopo: caixa.parentElement ?? caixa,
    midia: () => video,
    codigoRapido: () => doPlayer()?.codigo ?? null,
    resolver: async () => {
      const l = doPlayer();
      if (l) return { tipo: "post", codigo: l.codigo, origem: l.origem, fonte: "link-do-player" };
      const u = codigoDaUrl();
      if (u && ehOAtual()) return { tipo: "post", codigo: u.codigo, origem: u.origem, fonte: "url+video-visivel" };
      const r = await codigoPeloReact(video);
      return r ? { tipo: "post", codigo: r, origem: "reel", fonte: "react-da-midia" } : null;
    },
  };
}

// ---------------- story aberto ----------------
function alvoStory(midia: HTMLElement, caixa: HTMLElement): Alvo {
  return {
    tipo: "story",
    caixa,
    escopo: caixa.parentElement ?? caixa,
    midia: () => midia,
    codigoRapido: () => storyDaUrl()?.id ?? null,
    resolver: async () => {
      const s = storyDaUrl();
      if (!s) return null;
      // pistas da mídia DESTE botão (não do meio da tela)
      const atual = maiorMidia(caixa) ?? midia;
      // vídeo: a duração e, se houver, a capa (desempata partes de 60 s com a mesma duração)
      const pista = atual instanceof HTMLVideoElement
        ? { duracao: isFinite(atual.duration) ? Math.round(atual.duration * 10) / 10 : undefined, imagens: [atual.poster].filter(Boolean) }
        : { imagens: [(atual as HTMLImageElement).currentSrc || (atual as HTMLImageElement).src].filter(Boolean) };
      return { tipo: "story", usuario: s.usuario, id: s.id, pista };
    },
  };
}

/** O elemento que envolve a mídia do mesmo tamanho (onde o botão fica no canto). */
function caixaDaMidia(midia: HTMLElement): HTMLElement {
  const r = midia.getBoundingClientRect();
  let caixa = midia.parentElement ?? midia;
  for (let el = caixa.parentElement, i = 0; el && i < 4; el = el.parentElement, i++) {
    const p = el.getBoundingClientRect();
    if (Math.abs(p.width - r.width) > 4 || Math.abs(p.height - r.height) > 4) break;
    caixa = el;
  }
  return caixa;
}

const MARCA = "data-ig-grabber";

/** Mídias novas na tela que ainda não têm botão. */
export function novosAlvos(): Alvo[] {
  const novos: Alvo[] = [];
  if (storyDaUrl()) {
    const midia = [...document.querySelectorAll<HTMLElement>("video, img")]
      .filter((el) => el.getBoundingClientRect().height > innerHeight * 0.4 && fracaoVisivel(el) > 0.5)
      .sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0];
    if (midia) {
      const caixa = caixaDaMidia(midia);
      if (!caixa.hasAttribute(MARCA)) { caixa.setAttribute(MARCA, "story"); novos.push(alvoStory(midia, caixa)); }
    }
    return novos;
  }
  for (const artigo of document.querySelectorAll<HTMLElement>("article")) {
    if (artigo.hasAttribute(MARCA) || artigo.getBoundingClientRect().height < 200) continue;
    if (!maiorMidia(artigo)) continue; // ainda carregando: tenta na próxima mudança
    artigo.setAttribute(MARCA, "artigo");
    novos.push(alvoArtigo(artigo));
  }
  for (const video of document.querySelectorAll<HTMLVideoElement>("video")) {
    if (video.closest("article") || video.getBoundingClientRect().height < 300) continue;
    const caixa = caixaDaMidia(video);
    if (caixa.hasAttribute(MARCA)) continue;
    caixa.setAttribute(MARCA, "player");
    novos.push(alvoPlayer(video, caixa));
  }
  return novos;
}

/**
 * Qual slide do carrossel está visível neste post: a <img> (ou o poster do <video>) mais ao
 * centro da mídia, casada pelo nome do arquivo com os slides que a API devolveu.
 */
export function slideVisivel(alvo: Alvo, post: Post): number | null {
  const area = alvo.midia()?.getBoundingClientRect();
  if (!area) return null;
  const cx = (area.left + area.right) / 2;
  const candidatos = [...alvo.caixa.querySelectorAll<HTMLElement>("img, video")]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.height >= CONFIG.alturaMinimaMidia && r.left < cx && r.right > cx)
    .sort((a, b) => Math.abs((a.r.left + a.r.right) / 2 - cx) - Math.abs((b.r.left + b.r.right) / 2 - cx));
  for (const { el } of candidatos) {
    const src = el instanceof HTMLImageElement ? el.currentSrc || el.src : (el as HTMLVideoElement).poster;
    const nome = src ? nomeDoArquivo(src) : null;
    if (!nome) continue;
    const m = post.midias.find((x) => x.nomesArquivo.includes(nome));
    if (m) return m.indice;
  }
  return null;
}
