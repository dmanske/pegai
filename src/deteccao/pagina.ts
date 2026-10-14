// Pergunta ao script do mundo da página (src/pagina) qual post o React liga a ESTA mídia.
// É só reserva/conferência: a resposta só vale se for única.
let seq = 0;

export function codigoPeloReact(el: HTMLElement): Promise<string | null> {
  const id = `g${Date.now().toString(36)}${(seq++).toString(36)}`;
  el.setAttribute("data-ig-grabber-alvo", id);
  return new Promise((resolve) => {
    const fim = (codigo: string | null) => {
      window.removeEventListener("ig-grabber:resposta", ouvir);
      el.removeAttribute("data-ig-grabber-alvo");
      resolve(codigo);
    };
    const ouvir = (ev: Event) => {
      try {
        const r = JSON.parse(String((ev as CustomEvent).detail));
        if (r.id === id) fim(typeof r.codigo === "string" ? r.codigo : null);
      } catch { /* resposta de outro pedido */ }
    };
    window.addEventListener("ig-grabber:resposta", ouvir);
    window.dispatchEvent(new CustomEvent("ig-grabber:pedir", { detail: JSON.stringify({ id }) }));
    setTimeout(() => fim(null), 1500);
  });
}
