// Copies the RDKit.js WebAssembly runtime out of node_modules into public/rdkit
// so that it can be served as a static asset (including under a GitHub Pages
// subpath). Run automatically via the pre* npm scripts.
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const src = join(root, 'node_modules', '@rdkit', 'rdkit', 'dist');
const dest = join(root, 'public', 'rdkit');

const files = ['RDKit_minimal.js', 'RDKit_minimal.wasm'];

await mkdir(dest, { recursive: true });
for (const file of files) {
  const from = join(src, file);
  if (!existsSync(from)) {
    console.error(`[copy-rdkit] missing ${from}. Did "npm install" run?`);
    process.exit(1);
  }
  await copyFile(from, join(dest, file));
  console.log(`[copy-rdkit] ${file} -> public/rdkit/${file}`);
}
