// Como cada mídia descobre o PRÓPRIO código de post. Nunca pelo meio da tela.
import type { Origem } from "../shared/types.ts";

const RE_POST = /\/(p|reel|reels|tv)\/([A-Za-z0-9_-]{8,})/;

export interface CodigoUrl { codigo: string; origem: Exclude<Origem, "story"> }

/** Código do post na URL da página (/p/X, /reel/X, /reels/X). */
export function codigoDaUrl(): CodigoUrl | null {
  const m = location.pathname.match(RE_POST);
  if (!m) return null;
  return { codigo: m[2], origem: m[1] === "p" || m[1] === "tv" ? "post" : "reel" };
}

/** Código de um href de link do Instagram. */
export function codigoDoHref(href: string | null): CodigoUrl | null {
  const m = (href ?? "").match(RE_POST);
  if (!m) return null;
  return { codigo: m[2], origem: m[1] === "p" || m[1] === "tv" ? "post" : "reel" };
}

/**
 * Código pelos links DENTRO do contêiner: o horário, "ver comentários" etc. apontam para o
 * próprio post. Vale o mais frequente; empate entre códigos diferentes = não sabe (null).
 */
export function codigoDosLinks(raiz: Element): CodigoUrl | null {
  const contagem = new Map<string, { n: number; origem: CodigoUrl["origem"] }>();
  for (const a of raiz.querySelectorAll<HTMLAnchorElement>('a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]')) {
    const c = codigoDoHref(a.getAttribute("href"));
    if (!c) continue;
    const atual = contagem.get(c.codigo);
    // o link do horário (<time>) vale mais: é sempre o do próprio post
    const peso = a.querySelector("time") ? 3 : 1;
    contagem.set(c.codigo, { n: (atual?.n ?? 0) + peso, origem: atual?.origem ?? c.origem });
  }
  const ordem = [...contagem.entries()].sort((a, b) => b[1].n - a[1].n);
  if (!ordem.length) return null;
  if (ordem.length > 1 && ordem[0][1].n === ordem[1][1].n) return null;
  return { codigo: ordem[0][0], origem: ordem[0][1].origem };
}

/** /stories/<usuario>/<id?>/ */
export function storyDaUrl(): { usuario: string; id: string | null } | null {
  const m = location.pathname.match(/^\/stories\/([^/]+)(?:\/(\d+))?/);
  if (!m || m[1] === "highlights") return null;
  return { usuario: m[1], id: m[2] ?? null };
}
