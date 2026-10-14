// O botão de baixar de UMA mídia: host com Shadow DOM, estados e dica.
// (customElements não existe no mundo isolado do content script, por isso um <div> com shadow.)
// Carrossel: um 2º botão azul, abaixo, baixa todos os slides;
// o Shift+clique no branco continua valendo como atalho.
import { CONFIG } from "../shared/config.ts";
import { ESTILO } from "./estilo.ts";
import { ICONES } from "./icones.ts";

export type Estado = "normal" | "baixando" | "pronto" | "erro" | "desativado";

export interface Botao {
  host: HTMLElement;
  mudar(estado: Estado, dica?: string): void;
  marcarJaBaixado(texto: string | null): void;
  mostrar(sim: boolean): void;
  /** Mostra/esconde o 2º botão (carrossel inteiro). */
  mostrarTodos(sim: boolean): void;
}

const DICA_NORMAL = "Baixar";
const DICA_SLIDE = "Baixar este slide";
const DICA_TODOS = "Baixar o carrossel inteiro";
const TOPO_PRINCIPAL = "18px", TOPO_TODOS = "62px"; // centro de cada botão (36 px + 8 de espaço)

export function criarBotao(opcoes: { carrossel: () => boolean; aoClicar: (todos: boolean) => void }): Botao {
  const host = document.createElement("div");
  host.setAttribute("data-ig-grabber-botao", "");
  const raiz = host.attachShadow({ mode: "closed" });
  raiz.innerHTML = `<style>${ESTILO}</style><div class="caixa"><button type="button" class="principal"></button><button type="button" class="todos" hidden></button><span class="dica" role="status"></span></div>`;
  const botao = raiz.querySelector("button.principal") as HTMLButtonElement;
  const botaoTodos = raiz.querySelector("button.todos") as HTMLButtonElement;
  const dica = raiz.querySelector(".dica") as HTMLSpanElement;
  botaoTodos.innerHTML = ICONES.todos;
  botaoTodos.setAttribute("aria-label", DICA_TODOS);

  let estado: Estado = "normal";
  let textoJa: string | null = null;
  let timerDica: number | undefined;
  let timerVolta: number | undefined;

  const dicaPadrao = () => textoJa ?? (opcoes.carrossel() ? DICA_SLIDE : DICA_NORMAL);
  const posDica = (topo: string) => dica.style.setProperty("--topo-dica", topo);

  function desenhar(textoDica: string) {
    botao.dataset.estado = estado;
    host.dataset.estado = estado; // visível de fora do shadow (diagnóstico e testes)
    const ponto = textoJa && estado === "normal" ? '<span class="ponto"></span>' : "";
    botao.innerHTML = (estado === "baixando" ? '<span class="giro"></span>'
      : estado === "pronto" ? ICONES.pronto
      : estado === "erro" ? ICONES.erro
      : estado === "desativado" ? ICONES.desativado
      : ICONES.baixar) + ponto;
    botao.setAttribute("aria-label", textoDica);
    botaoTodos.disabled = estado === "baixando";
    dica.textContent = textoDica;
    host.classList.toggle("ocupado", estado === "baixando" || estado === "pronto" || estado === "erro");
  }

  function mudar(novo: Estado, texto?: string) {
    clearTimeout(timerVolta);
    estado = novo;
    const t = texto ?? dicaPadrao();
    posDica(TOPO_PRINCIPAL);
    desenhar(t);
    dica.classList.toggle("mostra", novo === "baixando" || novo === "erro" || novo === "pronto");
    if (novo === "pronto" || novo === "erro") {
      timerVolta = window.setTimeout(() => { mudar("normal"); dica.classList.remove("mostra"); }, novo === "erro" ? 8_000 : CONFIG.tempoPronto);
    }
  }

  const clicar = (todos: boolean) => (ev: MouseEvent) => {
    ev.preventDefault(); ev.stopPropagation();
    if (estado === "baixando" || estado === "desativado") return;
    opcoes.aoClicar(todos || ev.shiftKey);
  };
  botao.addEventListener("click", clicar(false));
  botaoTodos.addEventListener("click", clicar(true));

  for (const b of [botao, botaoTodos]) {
    // o Instagram trata clique/toque na mídia (curtir, pausar, passar slide): não deixa passar
    for (const tipo of ["mousedown", "mouseup", "pointerdown", "pointerup", "dblclick", "touchstart"]) {
      b.addEventListener(tipo, (ev) => ev.stopPropagation());
    }
    b.addEventListener("mouseenter", () => {
      if (estado !== "normal" && estado !== "desativado") return;
      const ehTodos = b === botaoTodos;
      timerDica = window.setTimeout(() => {
        posDica(ehTodos ? TOPO_TODOS : TOPO_PRINCIPAL);
        if (estado !== "desativado") dica.textContent = ehTodos ? DICA_TODOS : dicaPadrao();
        dica.classList.add("mostra");
      }, CONFIG.atrasoDica);
    });
    b.addEventListener("mouseleave", () => {
      clearTimeout(timerDica);
      if (estado === "normal" || estado === "desativado") dica.classList.remove("mostra");
    });
  }

  mudar("normal");
  return {
    host,
    mudar,
    marcarJaBaixado(texto) { textoJa = texto; if (estado === "normal") desenhar(dicaPadrao()); },
    mostrar(sim) { host.classList.toggle("visivel", sim); },
    mostrarTodos(sim) {
      botaoTodos.hidden = !sim;
      host.dataset.carrossel = sim ? "1" : ""; // diagnóstico e testes
      if (estado === "normal") desenhar(dicaPadrao());
    },
  };
}
