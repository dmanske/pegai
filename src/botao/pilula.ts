// Botão em pílula para ações de página inteira (ex.: "Baixar coleção"), com Shadow DOM.
import { ICONES } from "./icones.ts";

export type EstadoPilula = "normal" | "ocupado" | "pronto" | "erro";

export interface Pilula {
  host: HTMLElement;
  mudar(estado: EstadoPilula, texto: string, detalhe?: string): void;
}

const ESTILO = `
/* a caixa tem o tamanho do botão (o detalhe flutua embaixo): o centro dela é sempre o botão */
:host { all: initial; display: inline-block; position: relative; margin: 12px 0 26px;
  width: max-content; align-self: flex-start; } /* a página põe numa coluna flex que esticava a caixa (911 px) */
button { all: unset; box-sizing: border-box; display: inline-flex; align-items: center; gap: 8px;
  min-height: 36px; padding: 0 16px 0 12px; border-radius: 999px; cursor: pointer;
  font: 600 14px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #111; color: #fff; transition: background .12s ease, transform .12s ease; }
button:hover { background: #2a2a2a; }
button:active { transform: scale(.98); }
button:focus-visible { outline: 2px solid #0095f6; outline-offset: 2px; }
button[data-estado="pronto"] { background: #1f8a4c; }
button[data-estado="erro"] { background: #c62828; }
svg { width: 18px; height: 18px; }
.giro { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff;
  animation: giro .8s linear infinite; }
@keyframes giro { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .giro { animation-duration: 2.4s; } }
.detalhe { position: absolute; left: 2px; top: calc(100% + 6px); width: max-content; max-width: 70vw; font: 400 12.5px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #737373; }
`;

export function criarPilula(aoClicar: () => void): Pilula {
  const host = document.createElement("div");
  host.setAttribute("data-ig-grabber-colecao", "");
  const raiz = host.attachShadow({ mode: "closed" });
  raiz.innerHTML = `<style>${ESTILO}</style><button type="button"></button><span class="detalhe" role="status"></span>`;
  const botao = raiz.querySelector("button")!;
  const detalhe = raiz.querySelector(".detalhe") as HTMLSpanElement;
  botao.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); aoClicar(); });

  return {
    host,
    mudar(estado, texto, det = "") {
      botao.dataset.estado = estado;
      host.dataset.estado = estado; // visível de fora (diagnóstico e testes)
      const icone = estado === "ocupado" ? '<span class="giro"></span>' : estado === "pronto" ? ICONES.pronto : estado === "erro" ? ICONES.erro : ICONES.baixar;
      botao.innerHTML = icone + `<span></span>`;
      (botao.lastElementChild as HTMLSpanElement).textContent = texto;
      botao.setAttribute("aria-label", texto);
      detalhe.textContent = det;
      host.dataset.texto = texto; // idem
      host.dataset.detalhe = det;
    },
  };
}
