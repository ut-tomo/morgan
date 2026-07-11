// Graph helpers + the exact-tuple label dictionary used by the educational
// refinement. The dictionary assigns integer ids to keys in order of first
// appearance — a deterministic, lossless encoding (no hashing).

import type { MolecularGraph, NeighborLink } from './types';

export class LabelDictionary {
  private readonly map = new Map<string, number>();
  private next = 0;

  /** Return the id for `key`, assigning a fresh one on first sight. */
  encode(key: string): number {
    const existing = this.map.get(key);
    if (existing !== undefined) return existing;
    const id = this.next++;
    this.map.set(key, id);
    return id;
  }

  /** Whether the key has already been assigned an id. */
  has(key: string): boolean {
    return this.map.has(key);
  }

  size(): number {
    return this.map.size;
  }

  entries(): Array<[string, number]> {
    return [...this.map.entries()];
  }
}

export function neighbors(graph: MolecularGraph, atom: number): NeighborLink[] {
  return graph.adjacency[atom] ?? [];
}

export function countDistinct(values: number[]): number {
  return new Set(values).size;
}

/**
 * Collect the atom indices reachable within `radius` bonds of `center`
 * (inclusive), together with the bond indices strictly inside that ball.
 * Used to highlight the circular environment a feature summarizes.
 */
export function environmentBall(
  graph: MolecularGraph,
  center: number,
  radius: number,
): { atoms: number[]; bonds: number[] } {
  const seenAtoms = new Set<number>([center]);
  const seenBonds = new Set<number>();
  let frontier = [center];
  for (let r = 0; r < radius; r++) {
    const nextFrontier: number[] = [];
    for (const a of frontier) {
      for (const link of neighbors(graph, a)) {
        seenBonds.add(link.bond);
        if (!seenAtoms.has(link.atom)) {
          seenAtoms.add(link.atom);
          nextFrontier.push(link.atom);
        }
      }
    }
    frontier = nextFrontier;
  }
  return {
    atoms: [...seenAtoms].sort((a, b) => a - b),
    bonds: [...seenBonds].sort((a, b) => a - b),
  };
}
