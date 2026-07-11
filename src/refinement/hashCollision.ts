// Illustrative environment-identifier hashing (collision mechanism #3).
//
// A practical circular-fingerprint implementation turns each structured
// environment signature into an integer identifier by HASHING it. Distinct
// signatures can then map to the same identifier — a mechanism distinct from
// finite radius, from refinement expressivity, and from bit-folding.
//
// The educational WL mode in this app deliberately uses an exact-tuple
// dictionary (no hashing), precisely so learners can see this cause in
// isolation. This helper provides a small, deterministic TOY hash so the
// collision can be demonstrated with intermediate values. It is NOT RDKit's
// hash and is not used for the actual fingerprint.

/** Deterministic 32-bit FNV-1a hash of a string. */
export function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    // 32-bit FNV prime multiply via shifts, kept in unsigned range.
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export interface HashCollision {
  bucket: number;
  a: string;
  b: string;
  fullHashA: number;
  fullHashB: number;
  modulus: number;
}

/**
 * Find the first pair of DISTINCT signatures that hash to the same bucket under
 * `fnv1a(sig) % modulus`. Returns null if the signatures are collision-free at
 * that modulus.
 */
export function findHashCollision(
  signatures: string[],
  modulus: number,
): HashCollision | null {
  const seen = new Map<number, { sig: string; full: number }>();
  for (const sig of signatures) {
    const full = fnv1a(sig);
    const bucket = full % modulus;
    const prev = seen.get(bucket);
    if (prev && prev.sig !== sig) {
      return {
        bucket,
        a: prev.sig,
        b: sig,
        fullHashA: prev.full,
        fullHashB: full,
        modulus,
      };
    }
    if (!prev) seen.set(bucket, { sig, full });
  }
  return null;
}

/**
 * Smallest modulus (from `start` downward to 1) at which the given signatures
 * still collide, i.e. the first collision found while shrinking the space.
 * Guarantees a collision exists when modulus < number of distinct signatures
 * (pigeonhole). We scan from a modestly small value to surface a clear example.
 */
export function firstCollisionAtModulus(
  signatures: string[],
  candidateModuli: number[],
): HashCollision | null {
  for (const m of candidateModuli) {
    const hit = findHashCollision(signatures, m);
    if (hit) return hit;
  }
  return null;
}
