// Erros que valem para mais de uma tela do content script.

/**
 * A extensão foi atualizada/recarregada e esta aba do Instagram continua com o script antigo, que perdeu
 * o acesso ao chrome.* ("Extension context invalidated"). Só recarregar a página resolve.
 */
export function extensaoRecarregada(e: unknown): boolean {
  return !chrome.runtime?.id || (e instanceof Error && /Extension context invalidated/i.test(e.message));
}

export const MSG_EXTENSAO_RECARREGADA = "O Pegaí foi atualizado. Recarregue esta página do Instagram (F5) e tente de novo.";
