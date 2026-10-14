// Ícones SVG do botão (traço 2 px, desenhados para 20 px).
const svg = (corpo: string) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corpo}</svg>`;

export const ICONES = {
  baixar: svg('<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>'),
  pronto: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  erro: svg('<path d="M12 7v6"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="9"/>'),
  desativado: svg('<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>'),
  // "camadas": o carrossel inteiro
  todos: svg('<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>'),
} as const;
