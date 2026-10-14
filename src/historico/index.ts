// Histórico dos posts baixados (chrome.storage.local): acende o "já baixado" no botão
// e alimenta a lista do popup. Content script e popup usam direto.
import { CHAVES, CONFIG } from "../shared/config.ts";
import type { RegistroHistorico } from "../shared/types.ts";

type Mapa = Record<string, RegistroHistorico>;

async function lerMapa(): Promise<Mapa> {
  const r = await chrome.storage.local.get(CHAVES.historico);
  return (r[CHAVES.historico] as Mapa | undefined) ?? {};
}

export async function jaBaixado(codigo: string): Promise<RegistroHistorico | null> {
  return (await lerMapa())[codigo] ?? null;
}

export async function registrar(reg: RegistroHistorico): Promise<void> {
  const mapa = await lerMapa();
  mapa[reg.codigo] = reg;
  const chaves = Object.keys(mapa);
  if (chaves.length > CONFIG.limiteHistorico) {
    // sai o mais antigo
    chaves.sort((a, b) => mapa[a].baixadoEm.localeCompare(mapa[b].baixadoEm));
    for (const k of chaves.slice(0, chaves.length - CONFIG.limiteHistorico)) delete mapa[k];
  }
  await chrome.storage.local.set({ [CHAVES.historico]: mapa });
}

export async function ultimos(n: number = CONFIG.ultimosNoPopup): Promise<RegistroHistorico[]> {
  return Object.values(await lerMapa()).sort((a, b) => b.baixadoEm.localeCompare(a.baixadoEm)).slice(0, n);
}

/** Avisa quando o histórico muda (outra aba baixou o mesmo post). */
export function aoMudar(fn: () => void): void {
  chrome.storage.onChanged.addListener((mudancas, area) => { if (area === "local" && mudancas[CHAVES.historico]) fn(); });
}

export async function pastaBase(): Promise<string> {
  const r = await chrome.storage.local.get(CHAVES.pastaBase);
  const p = String(r[CHAVES.pastaBase] ?? "").trim();
  // "Pegai" (padrão da 1.0.0) é a pasta da própria extensão descompactada: usa a nova.
  if (!p || p === CONFIG.pastaAntiga) return CONFIG.pastaBasePadrao;
  return p;
}

export async function mudarPastaBase(pasta: string): Promise<void> {
  await chrome.storage.local.set({ [CHAVES.pastaBase]: pasta.trim() || CONFIG.pastaBasePadrao });
}
