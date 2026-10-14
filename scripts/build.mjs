// Empacota a extensão em dist/ (carregar essa pasta em chrome://extensions).
// Content scripts do MV3 não aceitam módulos ES soltos, por isso o esbuild (design §10).
import { build, context } from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";

const assistir = process.argv.includes("--watch");
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

// cada entrada vira um arquivo IIFE independente
const entradas = {
  conteudo: "src/deteccao/index.ts",   // content script (mundo isolado): acha as mídias e põe os botões
  pagina: "src/pagina/index.ts",       // mundo da página: lê o React do Instagram (só conferência)
  fundo: "src/download/index.ts",      // service worker: chrome.downloads e histórico
  popup: "src/popup/index.ts",         // tela do ícone da extensão
};

const opcoes = {
  entryPoints: entradas,
  outdir: "dist",
  bundle: true,
  format: "iife",
  target: "chrome120",
  minify: false,
  sourcemap: assistir ? "inline" : false,
  logLevel: "info",
};

function copiarEstaticos() {
  cpSync("public", "dist", { recursive: true });
}

if (assistir) {
  copiarEstaticos();
  const ctx = await context(opcoes);
  await ctx.watch();
} else {
  await build(opcoes);
  copiarEstaticos();
}
