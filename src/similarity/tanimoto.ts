// Tanimoto similarity for bit fingerprints.
//
// Tanimoto = |A ∩ B| / (|A| + |B| - |A ∩ B|).
// The all-zero case (both fingerprints empty) is defined here to be 1.0 (two
// identical empty sets), which we surface explicitly rather than dividing by 0.
//
// Note: fingerprint similarity is a similarity of feature sets, NOT a test of
// graph isomorphism.

export interface TanimotoResult {
  tanimoto: number;
  intersection: number;
  onlyA: number;
  onlyB: number;
  popcountA: number;
  popcountB: number;
  /** True when both inputs are all-zero. */
  bothEmpty: boolean;
}

export function tanimotoFromSets(a: Set<number>, b: Set<number>): TanimotoResult {
  let intersection = 0;
  for (const bit of a) if (b.has(bit)) intersection += 1;
  const popcountA = a.size;
  const popcountB = b.size;
  const union = popcountA + popcountB - intersection;
  const bothEmpty = popcountA === 0 && popcountB === 0;
  const tanimoto = union === 0 ? 1 : intersection / union;
  return {
    tanimoto,
    intersection,
    onlyA: popcountA - intersection,
    onlyB: popcountB - intersection,
    popcountA,
    popcountB,
    bothEmpty,
  };
}

export function tanimotoFromBits(
  setBitsA: number[],
  setBitsB: number[],
): TanimotoResult {
  return tanimotoFromSets(new Set(setBitsA), new Set(setBitsB));
}

/** Just the coefficient, for convenience. */
export function tanimoto(setBitsA: number[], setBitsB: number[]): number {
  return tanimotoFromBits(setBitsA, setBitsB).tanimoto;
}
