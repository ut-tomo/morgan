// Test helpers for building small MolecularGraphs by hand and permuting them.
import type {
  AtomRecord,
  BondRecord,
  BondType,
  MolecularGraph,
  NeighborLink,
} from '../refinement/types';

const Z: Record<string, number> = { H: 1, C: 6, N: 7, O: 8, F: 9, S: 16, Cl: 17 };

export function makeGraph(
  elements: string[],
  edges: Array<[number, number, BondType?]>,
): MolecularGraph {
  const atoms: AtomRecord[] = elements.map((element, index) => ({
    index,
    element,
    atomicNumber: Z[element] ?? 6,
    formalCharge: 0,
    totalHs: 0,
    degree: 0,
    aromatic: false,
    inRing: false,
  }));
  const adjacency: NeighborLink[][] = atoms.map(() => []);
  const bonds: BondRecord[] = edges.map(([a, b, type], index) => {
    adjacency[a]!.push({ atom: b, bond: index });
    adjacency[b]!.push({ atom: a, bond: index });
    atoms[a]!.degree += 1;
    atoms[b]!.degree += 1;
    return {
      index,
      beginAtom: a,
      endAtom: b,
      bondType: type ?? 'SINGLE',
      aromatic: type === 'AROMATIC',
      inRing: false,
    };
  });
  for (const l of adjacency) l.sort((x, y) => x.atom - y.atom);
  return { atoms, bonds, adjacency };
}

/**
 * Relabel atoms by a permutation: newIndex = perm[oldIndex]. Returns a graph
 * that is isomorphic to the input but with atoms in a different order.
 */
export function permuteGraph(
  graph: MolecularGraph,
  perm: number[],
): MolecularGraph {
  const n = graph.atoms.length;
  const elements = new Array<string>(n);
  for (let old = 0; old < n; old++) elements[perm[old]!] = graph.atoms[old]!.element;
  const edges: Array<[number, number, BondType]> = graph.bonds.map((b) => [
    perm[b.beginAtom]!,
    perm[b.endAtom]!,
    b.bondType,
  ]);
  return makeGraph(elements, edges);
}

/** Multiset of partition-cell sizes for a labeling — permutation invariant. */
export function cellSizeHistogram(labels: number[]): number[] {
  const counts = new Map<number, number>();
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  return [...counts.values()].sort((a, b) => a - b);
}
