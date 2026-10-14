// Escolhe a MAIOR versão de cada mídia (largura × altura), em vez da primeira da lista —
// a primeira da lista nem sempre é a maior.
import type { Midia } from "../shared/types.ts";
import type { ItemIg, VersaoIg } from "./types/index.ts";

export function maiorVersao(versoes: VersaoIg[] | undefined): VersaoIg | null {
  if (!versoes?.length) return null;
  return versoes.reduce((melhor, v) => ((v.width ?? 0) * (v.height ?? 0) > (melhor.width ?? 0) * (melhor.height ?? 0) ? v : melhor));
}

/** Último trecho do caminho da URL (".../123_n.jpg?stp=..." → "123_n.jpg"). */
export function nomeDoArquivo(url: string): string | null {
  try { return new URL(url).pathname.split("/").pop() || null; } catch { return null; }
}

function umaMidia(item: ItemIg, indice: number): Midia | null {
  const imagens = item.image_versions2?.candidates ?? [];
  const nomesArquivo = imagens.map((c) => nomeDoArquivo(c.url)).filter((n): n is string => !!n);
  const video = maiorVersao(item.video_versions);
  if (video) return { url: video.url, ext: "mp4", largura: video.width ?? 0, altura: video.height ?? 0, indice, nomesArquivo };
  const foto = maiorVersao(imagens);
  if (foto) return { url: foto.url, ext: "jpg", largura: foto.width ?? 0, altura: foto.height ?? 0, indice, nomesArquivo };
  return null;
}

/** Post simples → 1 mídia; carrossel → uma por slide, na ordem. */
export function midiasDoItem(item: ItemIg): Midia[] {
  const partes = item.carousel_media?.length ? item.carousel_media : [item];
  return partes.map((p, i) => umaMidia(p, i)).filter((m): m is Midia => !!m);
}
