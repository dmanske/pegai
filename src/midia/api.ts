// API interna do Instagram, com a sessão de quem está logado (roda no content script,
// dentro do instagram.com).
import type { Midia, Origem, Post } from "../shared/types.ts";
import type { ItemIg, PistaStory, UsuarioIg } from "./types/index.ts";
import { midiasDoItem, nomeDoArquivo } from "./versoes.ts";

const IG_APP_ID = "936619743392459";
const DOC_ID_POST = "27116338451299930"; // GraphQL por shortcode (reserva)

/** Erro da API com o status HTTP, para decidir se vale tentar de novo. */
export class ErroIg extends Error {
  constructor(mensagem: string, readonly status: number) { super(mensagem); }
}

function cookie(nome: string): string {
  const m = document.cookie.match(new RegExp("(?:^|; )" + nome + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

function headersIg(): Record<string, string> {
  return {
    "X-IG-App-ID": IG_APP_ID,
    "X-ASBD-ID": "129477",
    "X-IG-WWW-Claim": sessionStorage.getItem("www-claim-v2") || "0",
    "X-CSRFToken": cookie("csrftoken"),
    "X-Requested-With": "XMLHttpRequest",
  };
}

export async function pedirJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const r = await fetch(url, { ...init, headers: { ...headersIg(), ...(init.headers ?? {}) }, credentials: "include" });
  const texto = await r.text();
  if (r.status === 429) throw new ErroIg("O Instagram limitou os pedidos (429)", 429);
  if (!r.ok) throw new ErroIg(`Instagram respondeu ${r.status}`, r.status);
  try { return JSON.parse(texto); } catch { throw new ErroIg("Resposta do Instagram não é JSON (sessão expirou?)", r.status); }
}

/**
 * Shortcode (ex.: CxYz123AbcD) → id numérico da mídia.
 * Post de conta privada tem código LONGO (bem mais de 11 letras): o id está nas 11 primeiras
 * letras (com elas a API responde o post; com o código inteiro, erro 400).
 */
export function shortcodeParaId(shortcode: string): string {
  const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let id = 0n;
  for (const ch of shortcode.slice(0, 11)) {
    const i = abc.indexOf(ch);
    if (i < 0) throw new Error("código de post inválido");
    id = id * 64n + BigInt(i);
  }
  return id.toString();
}

const fotoDoPerfil = (u?: UsuarioIg) => u?.hd_profile_pic_url_info?.url || u?.profile_pic_url || "";

export function paraPost(item: ItemIg, codigo: string, origem: Origem, url: string): Post {
  const midias = midiasDoItem(item);
  return {
    codigo,
    autor: item.user?.username || "ig",
    url,
    origem,
    legenda: item.caption?.text || "",
    postadoEm: item.taken_at ? new Date(item.taken_at * 1000).toISOString() : null,
    fotoPerfil: fotoDoPerfil(item.user),
    midias,
    carrossel: (item.carousel_media?.length ?? 0) > 1,
    miniatura: menorCapa(item),
  };
}

/** A menor imagem da capa (vídeo também tem capa em image_versions2). */
function menorCapa(item: ItemIg): string | null {
  const c = (item.carousel_media?.[0] ?? item).image_versions2?.candidates ?? [];
  if (!c.length) return null;
  return c.reduce((menor, v) => ((v.width ?? 1e9) < (menor.width ?? 1e9) ? v : menor)).url;
}

/** Post ou reel pelo shortcode: API de mídia; reserva GraphQL. */
export async function buscarPost(codigo: string, origem: Exclude<Origem, "story">): Promise<Post> {
  const url = `https://www.instagram.com/${origem === "reel" ? "reel" : "p"}/${codigo}/`;
  try {
    const j = (await pedirJson(`https://www.instagram.com/api/v1/media/${shortcodeParaId(codigo)}/info/`)) as { items?: ItemIg[] };
    const item = j.items?.[0];
    if (item) {
      // conferência: a API tem que devolver o MESMO post que o botão pediu
      if (item.code && item.code !== codigo) throw new ErroIg(`A API devolveu outro post (${item.code})`, 0);
      return paraPost(item, codigo, origem, url);
    }
  } catch (e) {
    if (e instanceof ErroIg && e.status === 429) throw e; // limitado: não adianta a reserva agora
  }
  return buscarPostGraphql(codigo, origem, url);
}

interface NoGraphql {
  video_url?: string; display_url?: string; shortcode?: string; taken_at_timestamp?: number;
  dimensions?: { width?: number; height?: number };
  edge_sidecar_to_children?: { edges?: { node: NoGraphql }[] };
  edge_media_to_caption?: { edges?: { node: { text?: string } }[] };
  owner?: { username?: string; profile_pic_url?: string };
}

async function buscarPostGraphql(codigo: string, origem: Exclude<Origem, "story">, url: string): Promise<Post> {
  const corpo = new URLSearchParams({ doc_id: DOC_ID_POST, variables: JSON.stringify({ shortcode: codigo }) });
  const j = (await pedirJson("https://www.instagram.com/graphql/query/", {
    method: "POST", body: corpo, headers: { "Content-Type": "application/x-www-form-urlencoded" },
  })) as { data?: { xdt_shortcode_media?: NoGraphql; shortcode_media?: NoGraphql } };
  const m = j.data?.xdt_shortcode_media || j.data?.shortcode_media;
  if (!m) throw new ErroIg("O Instagram não devolveu este post", 404);
  if (m.shortcode && m.shortcode !== codigo) throw new ErroIg(`O GraphQL devolveu outro post (${m.shortcode})`, 0);
  const filhos = m.edge_sidecar_to_children?.edges?.map((e) => e.node) ?? [m];
  const midias = filhos.flatMap((n, indice): Midia[] => {
    const largura = n.dimensions?.width ?? 0, altura = n.dimensions?.height ?? 0;
    const nomes = n.display_url ? [nomeDoArquivo(n.display_url)].filter((x): x is string => !!x) : [];
    if (n.video_url) return [{ url: n.video_url, ext: "mp4", largura, altura, indice, nomesArquivo: nomes }];
    if (n.display_url) return [{ url: n.display_url, ext: "jpg", largura, altura, indice, nomesArquivo: nomes }];
    return [];
  });
  return {
    codigo, autor: m.owner?.username || "ig", url, origem,
    legenda: m.edge_media_to_caption?.edges?.[0]?.node?.text || "",
    postadoEm: m.taken_at_timestamp ? new Date(m.taken_at_timestamp * 1000).toISOString() : null,
    fotoPerfil: m.owner?.profile_pic_url || "",
    midias, carrossel: filhos.length > 1,
    miniatura: filhos[0]?.display_url ?? null,
  };
}

/** Story: com id na URL, busca direto; sem id, acha o da tela entre os ativos do usuário. */
export async function buscarStory(usuario: string, idStory: string | null, pista: PistaStory): Promise<Post> {
  const urlStory = (id: string) => `https://www.instagram.com/stories/${usuario}/${id}/`;
  if (idStory) {
    const j = (await pedirJson(`https://www.instagram.com/api/v1/media/${idStory}/info/`)) as { items?: ItemIg[] };
    const item = j.items?.[0];
    if (item) return paraPost(item, idStory, "story", urlStory(idStory));
  }
  // stories ativos do usuário: bandeja primeiro (raramente limita), depois o perfil
  let userId: string | null = null;
  let itens: ItemIg[] = [];
  // os itens da bandeja NÃO trazem o usuário (fica no nível de cima) — sem isso o autor ficaria vazio
  let dono: UsuarioIg = { username: usuario };
  try {
    const bandeja = (await pedirJson("https://www.instagram.com/api/v1/feed/reels_tray/")) as { tray?: { user?: UsuarioIg; items?: ItemIg[] }[] };
    const t = bandeja.tray?.find((x) => x.user?.username?.toLowerCase() === usuario.toLowerCase());
    if (t?.user?.pk) { userId = String(t.user.pk); itens = t.items ?? []; dono = t.user; }
  } catch (e) { if (e instanceof ErroIg && e.status === 429) throw e; }
  if (!userId) {
    const perfil = (await pedirJson(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(usuario)}`)) as { data?: { user?: { id?: string } } };
    userId = perfil.data?.user?.id ?? null;
    if (!userId) throw new ErroIg("Não achei o perfil deste story", 404);
  }
  if (!itens.length) {
    const j = (await pedirJson(`https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=${userId}`)) as {
      reels_media?: { items?: ItemIg[]; user?: UsuarioIg }[]; reels?: Record<string, { items?: ItemIg[]; user?: UsuarioIg }>;
    };
    const reel = j.reels_media?.[0] ?? j.reels?.[userId];
    itens = reel?.items ?? [];
    if (reel?.user?.username) dono = reel.user;
  }
  if (!itens.length) throw new ErroIg("Este perfil não tem stories ativos agora", 404);

  // o story da TELA: duração do vídeo tocando → nome do arquivo da imagem. Só vale se casar com UM:
  // vídeo longo vira partes de 60 s com a mesma duração, e pegar a primeira baixaria a parte errada.
  const unico = (lista: ItemIg[]) => (lista.length === 1 ? lista[0] : undefined);
  let alvo: ItemIg | undefined;
  if (pista.duracao) alvo = unico(itens.filter((i) => i.video_duration && Math.abs(i.video_duration - pista.duracao!) < 0.8));
  if (!alvo && pista.imagens?.length) {
    const nomes = pista.imagens.map(nomeDoArquivo).filter(Boolean);
    alvo = unico(itens.filter((i) => (i.image_versions2?.candidates ?? []).some((c) => nomes.includes(nomeDoArquivo(c.url)))));
  }
  if (!alvo) throw new ErroIg("Não consegui saber qual story está na tela — abra o story pelo link dele e tente de novo", 0);
  const id = String(alvo.pk ?? alvo.id ?? "").split("_")[0];
  return paraPost({ ...alvo, user: alvo.user?.username ? alvo.user : dono }, id, "story", urlStory(id));
}
