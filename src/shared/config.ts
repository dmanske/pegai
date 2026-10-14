// Valores configuráveis num lugar só.

export const CONFIG = {
  /**
   * Pasta dentro de Downloads (sem acento: evita problema em alguns programas). Dá para trocar no popup.
   * Até a 1.0.0 era "Pegai", o mesmo nome da pasta da extensão descompactada: os downloads caíam no meio dos
   * arquivos da extensão. Quem ainda tem "Pegai" gravado passa para esta (ver `pastaAntiga`).
   */
  pastaBasePadrao: "Pegai Downloads",
  /** Nome padrão da 1.0.0, trocado automaticamente pelo novo. */
  pastaAntiga: "Pegai",
  /** Subpasta das coleções salvas: Pegai Downloads/Coleções/<nome da coleção>/. */
  pastaColecoes: "Coleções",
  /** Esperas entre as novas tentativas (429, 5xx, rede), em ms. */
  esperasNovaTentativa: [2_000, 5_000, 30_000],
  /** Quantos posts o histórico guarda (os mais antigos saem). */
  limiteHistorico: 2_000,
  /** Quantos aparecem no popup. */
  ultimosNoPopup: 20,
  /** Quanto tempo o check verde fica no botão, em ms. */
  tempoPronto: 3_000,
  /** Atraso da dica ao passar o mouse, em ms. */
  atrasoDica: 250,
  /** Menor altura (px) para uma imagem/vídeo contar como mídia de post. */
  alturaMinimaMidia: 150,
  /** Coleção salva: pausa entre um post e outro, em ms (evita o 429 do Instagram). */
  pausaEntrePostsColecao: 1_500,
  /** Coleção salva: espera quando o Instagram limita (429), em ms, e quantas vezes tenta. */
  esperaLimiteColecao: 30_000,
  tentativasLimiteColecao: 3,
} as const;

/** Chaves do chrome.storage.local. */
export const CHAVES = {
  historico: "historico",
  pastaBase: "pastaBase",
} as const;
