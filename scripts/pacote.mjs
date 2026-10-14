// Gera o zip da versão (Pegai-<versão>.zip) a partir de dist/, para anexar no Release do GitHub.
// A pasta dentro do zip chama "Pegai-extensao": até a 1.0.0 ela se chamava "Pegai", o mesmo nome da pasta de
// downloads, e os arquivos baixados caíam no meio dos arquivos da extensão.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const PASTA_NO_ZIP = "Pegai-extensao";
const { version } = JSON.parse(readFileSync("public/manifest.json", "utf8"));
if (!existsSync("dist/manifest.json")) throw new Error("dist/ vazio: rode o build antes.");

const destino = resolve(`Pegai-${version}.zip`);
const temp = mkdtempSync(join(tmpdir(), "pegai-"));
try {
  cpSync("dist", join(temp, PASTA_NO_ZIP), { recursive: true });
  rmSync(destino, { force: true });
  execFileSync("zip", ["-r", "-q", "-X", destino, PASTA_NO_ZIP, "-x", "*.DS_Store"], { cwd: temp });
  console.log(`Pronto: ${destino} (pasta ${PASTA_NO_ZIP}/ dentro)`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
