// Roda no MUNDO DA PÁGINA (world: MAIN) para ler o React do Instagram, que o content script
// não enxerga. Só responde por UMA mídia marcada com data-ig-grabber-alvo, e só se achar UM
// código sem ambiguidade subindo a árvore a partir dela — nada de procurar pelo meio da tela
// (pegar o primeiro post de uma lista baixaria o post errado).

type Qualquer = Record<string, unknown>;

function fiberDe(el: Element): Qualquer | null {
  const chave = Object.keys(el).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
  return chave ? ((el as unknown as Qualquer)[chave] as Qualquer) : null;
}

const pareceMidia = (o: Qualquer) =>
  typeof o.code === "string" && (o.code as string).length >= 8 &&
  (o.media_type !== undefined || o.video_versions !== undefined || o.image_versions2 !== undefined || o.carousel_media !== undefined);

/** Códigos de mídia em `o` (até 4 níveis); para em 2 distintos (já é ambíguo). */
function codigosEm(o: unknown, prof: number, vistos: WeakSet<object>, achados: Set<string>): void {
  if (!o || typeof o !== "object" || prof > 4 || achados.size > 1) return;
  if (vistos.has(o)) return;
  vistos.add(o);
  const obj = o as Qualquer;
  if (obj.$$typeof) return;                                              // elemento React
  if (typeof obj.tag === "number" && "return" in obj && "child" in obj) return; // nó de fiber
  if (typeof Node !== "undefined" && o instanceof Node) return;
  if (pareceMidia(obj)) { achados.add(obj.code as string); return; }
  if (Array.isArray(o)) { for (const v of o.slice(0, 30)) codigosEm(v, prof + 1, vistos, achados); return; }
  for (const k in obj) {
    if (k.startsWith("__")) continue;
    let v: unknown;
    try { v = obj[k]; } catch { continue; }
    if (v && typeof v === "object") codigosEm(v, prof + 1, vistos, achados);
    if (achados.size > 1) return;
  }
}

function codigoDaMidia(el: Element): string | null {
  let f = fiberDe(el);
  for (let saltos = 0; f && saltos < 15; saltos++) {
    const achados = new Set<string>();
    codigosEm(f.memoizedProps, 0, new WeakSet(), achados);
    if (achados.size === 1) return [...achados][0];
    if (achados.size > 1) return null; // este nível guarda vários posts: ambíguo, não chuta
    f = f.return as Qualquer | null;
  }
  return null;
}

window.addEventListener("ig-grabber:pedir", (ev) => {
  let id = "";
  let codigo: string | null = null;
  try {
    id = JSON.parse(String((ev as CustomEvent).detail)).id;
    const el = document.querySelector(`[data-ig-grabber-alvo="${CSS.escape(id)}"]`);
    if (el) codigo = codigoDaMidia(el);
  } catch { /* responde null */ }
  window.dispatchEvent(new CustomEvent("ig-grabber:resposta", { detail: JSON.stringify({ id, codigo }) }));
});
