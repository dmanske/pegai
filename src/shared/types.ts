// Tipos usados por 2+ módulos (os demais ficam no types/ de cada módulo).

/** Uma mídia pronta para baixar. */
export interface Midia {
  url: string;
  ext: "mp4" | "jpg";
  largura: number;
  altura: number;
  /** Posição no carrossel (0, 1, 2…); 0 em post simples e story. */
  indice: number;
  /** Nomes de arquivo das versões (para achar o slide visível pela <img> da tela). */
  nomesArquivo: string[];
}

export type Origem = "post" | "reel" | "story";

/** O post completo, como a API devolveu, já reduzido ao que usamos. */
export interface Post {
  codigo: string;
  autor: string;
  url: string;
  origem: Origem;
  legenda: string;
  /** Data de publicação (ISO), se a API informar. */
  postadoEm: string | null;
  fotoPerfil: string;
  midias: Midia[];
  carrossel: boolean;
  /** Capa pequena (também para vídeo), para o popup. */
  miniatura: string | null;
}

/** Um post no histórico (chrome.storage.local). */
export interface RegistroHistorico {
  codigo: string;
  autor: string;
  url: string;
  origem: Origem;
  baixadoEm: string;
  arquivos: number;
  /** Miniatura para o popup (URL do CDN; pode expirar, é só enfeite). */
  miniatura: string | null;
  /** Nome da coleção salva, quando veio do "Baixar coleção". */
  colecao?: string;
  /** Pasta relativa ao Downloads ("Pegai Downloads/perfil"), para conferir se ainda existe. */
  pasta?: string;
}

// ---- mensagens entre o content script e o service worker ----

export type PedidoFundo =
  | { tipo: "baixar-arquivo"; url: string; caminho: string }
  | { tipo: "baixar-texto"; texto: string; caminho: string; mime: string }
  | { tipo: "existe"; pasta: string; codigo: string };

/** Resposta do pedido "existe": alguma mídia do post ainda está no disco? */
export interface RespostaExiste { existe: boolean }

/** Por que um download falhou, para o content script decidir o que fazer. */
export type MotivoFalha =
  | "expirado"          // 400/403/410 no CDN: buscar o post de novo (link novo)
  | "passageiro"        // rede, 5xx: tentar de novo depois de esperar
  | "pergunta-onde"     // o Chrome está com "Perguntar onde salvar" ligado
  | "outro";

export type RespostaFundo =
  | { ok: true; arquivo: string }
  | { ok: false; motivo: MotivoFalha; erro: string };
