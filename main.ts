// make.fun best-game-01 entry: Node 22 standard library only.
// Set MAKEFUN_OUTPUT_DIR for local runs; the grader defaults to /output.
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const out = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
// Never recursively delete the source tree, even with a mistaken local override.
if (resolve(root) === out || resolve(root).startsWith(out + sep) || out.startsWith(resolve(root) + sep)) {
  throw new Error('Output must be outside the entry directory');
}
mkdirSync(out, { recursive: true });
// Do not leave a stale dossier behind if the new build fails.
rmSync(join(out, 'dossier.json'), { force: true });
for (const dir of ['game', 'screenshots']) {
  rmSync(join(out, dir), { recursive: true, force: true });
  cpSync(join(root, dir), join(out, dir), { recursive: true, errorOnExist: true });
}
// The library enforces the maximum, but the competition gate also requires at least three.
const shots = readdirSync(join(out, 'screenshots'), { withFileTypes: true })
  .filter((entry) => entry.isFile() && !entry.name.startsWith('.'));
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`Expected 3 or 4 screenshots, found ${shots.length}`);
}
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
