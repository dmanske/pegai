// Popup do ícone: últimos downloads, pasta e ajuda do "Perguntar onde salvar".
import { mudarPastaBase, pastaBase, ultimos } from "../historico/index.ts";
import type { RegistroHistorico } from "../shared/types.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function item(r: RegistroHistorico): HTMLLIElement {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = r.url; a.target = "_blank"; a.rel = "noreferrer";
  const mini = document.createElement("span");
  mini.className = "mini";
  if (r.miniatura) mini.style.backgroundImage = `url("${r.miniatura.replace(/"/g, "%22")}")`;
  const txt = document.createElement("span");
  txt.className = "txt";
  const b = document.createElement("b");
  b.textContent = `@${r.autor}`;
  const s = document.createElement("span");
  const tipo = r.origem === "story" ? "story" : r.origem === "reel" ? "reel" : "post";
  s.textContent = `${tipo} · ${r.arquivos} arquivo${r.arquivos > 1 ? "s" : ""} · ${quando(r.baixadoEm)}`;
  txt.append(b, s);
  a.append(mini, txt);
  li.append(a);
  return li;
}

async function iniciar() {
  const lista = await ultimos();
  $("lista").replaceChildren(...lista.map(item));
  $("vazio").hidden = lista.length > 0;

  const campo = $<HTMLInputElement>("pasta");
  campo.value = await pastaBase();
  $("pasta-atual").textContent = campo.value;
  $("form-pasta").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    await mudarPastaBase(campo.value);
    campo.value = await pastaBase();
    const nota = $("nota-pasta");
    nota.textContent = `Salvo. Os próximos downloads vão para Downloads/${campo.value}.`;
    nota.classList.add("ok");
  });
  // link chrome:// não abre por <a>: só pela API de abas
  $("ajuda-salvar").addEventListener("click", () => chrome.tabs.create({ url: "chrome://settings/downloads" }));
}

void iniciar();
