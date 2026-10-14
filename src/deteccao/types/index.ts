import type { Origem } from "../../shared/types.ts";
import type { PistaStory } from "../../midia/types/index.ts";

/** De onde o código do post veio (diagnóstico e testes). */
export type FonteCodigo = "url" | "links-do-post" | "link-do-player" | "url+video-visivel" | "react-da-midia";

/** O que o botão sabe sobre a sua mídia na hora do clique. */
export type Referencia =
  | { tipo: "post"; codigo: string; origem: Exclude<Origem, "story">; fonte: FonteCodigo }
  | { tipo: "story"; usuario: string; id: string | null; pista: PistaStory };

export type TipoAlvo = "artigo" | "player" | "story";

export interface Alvo {
  tipo: TipoAlvo;
  /** Onde o botão é posto (position: relative). */
  caixa: HTMLElement;
  /** Onde o mouse acende o botão. */
  escopo: HTMLElement;
  /** A mídia principal (img/video) — para posicionar e achar o slide visível. */
  midia: () => HTMLElement | null;
  /** Resolve o post NA HORA do clique, sempre a partir desta mídia. */
  resolver: () => Promise<Referencia | null>;
  /** Código sem custo (para o "já baixado"); null se só der para saber no clique. */
  codigoRapido: () => string | null;
}
