// Posts de uma coleção salva, pela API que a extensão já usa (sem os tokens do GraphQL).
// GET /api/v1/feed/collection/<id>/posts/ → 200,
// items[].media completos (com video_versions), more_available + next_max_id para paginar.
import { CONFIG } from "../shared/config.ts";
import type { Post } from "../shared/types.ts";
import { ErroIg, paraPost, pedirJson } from "../midia/api.ts";
import type { ItemIg } from "../midia/types/index.ts";
import type { PaginaColecao } from "./types/index.ts";

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A página atual é uma coleção salva? (/<usuário>/saved/<nome>/<id>/) */
export function colecaoDaUrl(): PaginaColecao | null {
  const m = location.pathname.match(/^\/[^/]+\/saved\/([^/]+)\/(\d+)\/?$/);
  return m ? { slug: m[1], id: m[2] } : null;
}

interface PaginaApi { items?: { media?: ItemIg }[]; more_available?: boolean; next_max_id?: string }

/** Uma página da API; em 429 espera e tenta de novo. */
async function pagina(id: string, maxId: string | null): Promise<PaginaApi> {
  const url = `https://www.instagram.com/api/v1/feed/collection/${id}/posts/` + (maxId ? `?max_id=${encodeURIComponent(maxId)}` : "");
  for (let t = 0; ; t++) {
    try { return (await pedirJson(url)) as PaginaApi; }
    catch (e) {
      if (e instanceof ErroIg && e.status === 429 && t < CONFIG.tentativasLimiteColecao) { await esperar(CONFIG.esperaLimiteColecao); continue; }
      throw e;
    }
  }
}

/** Todos os posts da coleção, já no formato Post (com a maior versão de cada mídia). `parar` interrompe a listagem. */
export async function postsDaColecao(id: string, aoContar?: (n: number) => void, parar?: () => boolean): Promise<Post[]> {
  const posts: Post[] = [];
  let maxId: string | null = null;
  for (let voltas = 0; voltas < 200; voltas++) { // 200 páginas = teto de segurança
    if (parar?.()) break;
    const p = await pagina(id, maxId);
    for (const { media } of p.items ?? []) {
      if (!media?.code) continue;
      const reel = media.product_type === "clips";
      posts.push(paraPost(media, media.code, reel ? "reel" : "post", `https://www.instagram.com/${reel ? "reel" : "p"}/${media.code}/`));
    }
    aoContar?.(posts.length);
    if (!p.more_available || !p.next_max_id) break;
    maxId = p.next_max_id;
    await esperar(CONFIG.pausaEntrePostsColecao);
  }
  return posts;
}
