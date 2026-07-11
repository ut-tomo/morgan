// Adapter: RDKit Morgan fingerprint. This calls RDKit.js directly and returns
// EXACTLY what RDKit produced — we never substitute an educational reimplementation.

import type { BitFingerprint, MorganParams, RDKitModule } from './types';
import { InvalidSmilesError } from './molecule';

/** Parse a raw '0'/'1' RDKit fingerprint string into a BitFingerprint. */
export function parseBitString(raw: string, params: MorganParams): BitFingerprint {
  const setBits: number[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '1') setBits.push(i);
  }
  return {
    params,
    length: raw.length,
    raw,
    setBits,
    popcount: setBits.length,
  };
}

/**
 * Compute the real RDKit Morgan fingerprint for a SMILES string.
 *
 * The `nBits` key is the parameter name RDKit.js 2025.03 actually honours
 * (the shipped .d.ts documents `len`, which is silently ignored — verified at
 * runtime). We pass the exact object shown to the user in the UI.
 */
export function computeRdkitMorgan(
  rdkit: RDKitModule,
  smiles: string,
  params: MorganParams,
): BitFingerprint {
  const mol = rdkit.get_mol(smiles.trim());
  if (!mol) throw new InvalidSmilesError(smiles);
  try {
    if (!mol.is_valid()) throw new InvalidSmilesError(smiles);
    const raw = mol.get_morgan_fp(
      JSON.stringify({ radius: params.radius, nBits: params.nBits }),
    );
    return parseBitString(raw, params);
  } finally {
    mol.delete();
  }
}

/** The exact JSON object handed to RDKit.js, for transparent display. */
export function rdkitParamsJson(params: MorganParams): string {
  return JSON.stringify({ radius: params.radius, nBits: params.nBits });
}
