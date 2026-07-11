import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // RDKit-backed tests load the wasm module once; give them room.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
