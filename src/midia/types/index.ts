// Formato (parcial) dos itens da API interna do Instagram — só o que usamos.

export interface VersaoIg { url: string; width?: number; height?: number }

export interface UsuarioIg {
  username?: string;
  pk?: string | number;
  profile_pic_url?: string;
  hd_profile_pic_url_info?: { url?: string };
}

export interface ItemIg {
  pk?: string | number;
  id?: string;
  code?: string;
  media_type?: number;
  taken_at?: number;
  video_duration?: number;
  video_versions?: VersaoIg[];
  image_versions2?: { candidates?: VersaoIg[] };
  carousel_media?: ItemIg[];
  caption?: { text?: string } | null;
  user?: UsuarioIg;
  /** "clips" = reel */
  product_type?: string;
}

/** Pistas do story na tela, para achar qual item é (sem id na URL). */
export interface PistaStory {
  duracao?: number;
  imagens?: string[];
}
