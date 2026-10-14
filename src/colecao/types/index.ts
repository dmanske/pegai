/** Página de uma coleção salva: /<usuário>/saved/<nome>/<id>/ */
export interface PaginaColecao {
  id: string;
  /** "receitas-pra-fazer" (reserva quando o título não aparece) */
  slug: string;
}

export interface ResumoColecao {
  total: number;
  baixados: number;
  pulados: number;
  falhas: { codigo: string; erro: string }[];
  parado: boolean;
}
