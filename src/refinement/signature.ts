// Structured WL-like signature construction + canonical serialization.
//
// A signature is NEVER an ambiguous concatenated string. It is a structured
// object (self label + sorted multiset of (bond type, neighbor label) tokens),
// serialized canonically only for dictionary lookup and debugging.

import type { AtomSignature, BondType, NeighborToken } from './types';

const BOND_ORDER: Record<BondType, number> = {
  SINGLE: 0,
  DOUBLE: 1,
  TRIPLE: 2,
  AROMATIC: 3,
};

/** Deterministic ordering of neighbor tokens: by bond type, then neighbor label. */
export function sortNeighbors(neighbors: NeighborToken[]): NeighborToken[] {
  return [...neighbors].sort((a, b) => {
    const bo = BOND_ORDER[a.bondType] - BOND_ORDER[b.bondType];
    if (bo !== 0) return bo;
    return a.neighborLabel - b.neighborLabel;
  });
}

export function makeSignature(
  selfLabel: number,
  neighbors: NeighborToken[],
): AtomSignature {
  return { selfLabel, neighbors: sortNeighbors(neighbors) };
}

/**
 * Canonical JSON serialization. Because neighbors are pre-sorted, two atoms with
 * the same rooted environment always produce byte-identical keys, and two atoms
 * with different environments never collide (this is exact, not a hash).
 */
export function serializeSignature(sig: AtomSignature): string {
  return JSON.stringify({
    self: sig.selfLabel,
    nbrs: sig.neighbors.map((n) => [n.bondType, n.neighborLabel] as const),
  });
}

/** Human-readable rendering, e.g. "self=2 · [SINGLE→1, AROMATIC→4]". */
export function describeSignature(sig: AtomSignature): string {
  if (sig.neighbors.length === 0) return `self=${sig.selfLabel} · (no neighbors)`;
  const tokens = sig.neighbors
    .map((n) => `${n.bondType}→${n.neighborLabel}`)
    .join(', ');
  return `self=${sig.selfLabel} · [${tokens}]`;
}
