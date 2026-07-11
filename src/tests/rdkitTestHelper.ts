// Loads the real RDKit.js WASM module inside the Node test environment so that
// RDKit-backed tests exercise the ACTUAL library, not a reimplementation.
import initRDKitModule from '@rdkit/rdkit';
import type { RDKitModule } from '../rdkit/types';

let cached: Promise<RDKitModule> | null = null;

export function getTestRDKit(): Promise<RDKitModule> {
  if (!cached) {
    cached = (initRDKitModule as unknown as () => Promise<RDKitModule>)();
  }
  return cached;
}
