import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The GitHub Pages base path. When deploying to https://<user>.github.io/<repo>/
// the site is served from "/<repo>/". We read it from an env var so the same
// build works locally ("/") and on Pages ("/<repo>/").
//   - Locally: BASE_PATH unset -> "/"
//   - CI:      BASE_PATH="/<repo>/" (set by the GitHub Actions workflow)
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2021',
    outDir: 'dist',
  },
  // RDKit ships a large wasm binary; keep it out of dependency optimization.
  optimizeDeps: {
    exclude: ['@rdkit/rdkit'],
  },
});
