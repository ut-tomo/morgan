// Adapter: turn a SMILES string into plain-data structures via RDKit.js.
//
// Every JSMol created here is deleted in a finally block; nothing WASM-backed
// escapes this module.

import type {
  AtomRecord,
  BondRecord,
  BondType,
  MolecularGraph,
  NeighborLink,
} from '../refinement/types';
import type { MoleculeAnalysis, RDKitModule } from './types';
import { elementSymbol } from './periodicTable';

/** Shape of the RDKit commonchem JSON we consume (only the fields we use). */
interface CommonChemAtom {
  z?: number;
  chg?: number;
  impHs?: number;
}
interface CommonChemBond {
  atoms: [number, number];
  bo?: number;
}
interface CommonChemExtension {
  name: string;
  aromaticAtoms?: number[];
  aromaticBonds?: number[];
  atomRings?: number[][];
}
interface CommonChemMol {
  atoms: CommonChemAtom[];
  bonds: CommonChemBond[];
  extensions?: CommonChemExtension[];
}
interface CommonChemDoc {
  defaults: {
    atom: Required<Pick<CommonChemAtom, 'z' | 'chg' | 'impHs'>>;
    bond: Required<Pick<CommonChemBond, 'bo'>>;
  };
  molecules: CommonChemMol[];
}

export class InvalidSmilesError extends Error {
  constructor(smiles: string) {
    super(`RDKit could not parse SMILES: ${smiles}`);
    this.name = 'InvalidSmilesError';
  }
}

function bondTypeFromOrder(order: number, aromatic: boolean): BondType {
  if (aromatic) return 'AROMATIC';
  switch (order) {
    case 2:
      return 'DOUBLE';
    case 3:
      return 'TRIPLE';
    default:
      return 'SINGLE';
  }
}

/**
 * Build our heavy-atom MolecularGraph from RDKit's commonchem JSON.
 * Exported separately so it can be unit-tested against fixture JSON.
 */
export function graphFromCommonChem(doc: CommonChemDoc): MolecularGraph {
  const mol = doc.molecules[0];
  if (!mol) throw new Error('commonchem document contained no molecules');

  const atomDefaults = doc.defaults.atom;
  const bondDefaults = doc.defaults.bond;

  const ext = mol.extensions?.find((e) => e.name === 'rdkitRepresentation');
  const aromaticAtomSet = new Set(ext?.aromaticAtoms ?? []);
  const aromaticBondSet = new Set(ext?.aromaticBonds ?? []);
  const atomRings = ext?.atomRings ?? [];

  // Ring membership.
  const atomsInRing = new Set<number>();
  const ringBondPairs = new Set<string>();
  for (const ring of atomRings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!;
      const b = ring[(i + 1) % ring.length]!;
      atomsInRing.add(a);
      ringBondPairs.add(pairKey(a, b));
    }
  }

  const atoms: AtomRecord[] = mol.atoms.map((a, index) => {
    const atomicNumber = a.z ?? atomDefaults.z;
    return {
      index,
      element: elementSymbol(atomicNumber),
      atomicNumber,
      formalCharge: a.chg ?? atomDefaults.chg,
      totalHs: a.impHs ?? atomDefaults.impHs,
      degree: 0, // filled in after bonds
      aromatic: aromaticAtomSet.has(index),
      inRing: atomsInRing.has(index),
    };
  });

  const adjacency: NeighborLink[][] = atoms.map(() => []);

  const bonds: BondRecord[] = mol.bonds.map((b, index) => {
    const [begin, end] = b.atoms;
    const order = b.bo ?? bondDefaults.bo;
    const aromatic = aromaticBondSet.has(index);
    adjacency[begin]!.push({ atom: end, bond: index });
    adjacency[end]!.push({ atom: begin, bond: index });
    atoms[begin]!.degree += 1;
    atoms[end]!.degree += 1;
    return {
      index,
      beginAtom: begin,
      endAtom: end,
      bondType: bondTypeFromOrder(order, aromatic),
      aromatic,
      inRing: ringBondPairs.has(pairKey(begin, end)),
    };
  });

  // Keep neighbour lists in a stable order for reproducible signatures.
  for (const list of adjacency) list.sort((x, y) => x.atom - y.atom);

  return { atoms, bonds, adjacency };
}

function pairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * Parse a SMILES string and return a fully-materialised MoleculeAnalysis.
 * Throws InvalidSmilesError for input RDKit rejects.
 */
export function analyzeMolecule(
  rdkit: RDKitModule,
  smiles: string,
  options: { showAtomIndices?: boolean; width?: number; height?: number } = {},
): MoleculeAnalysis {
  const trimmed = smiles.trim();
  const mol = rdkit.get_mol(trimmed);
  if (!mol) throw new InvalidSmilesError(trimmed);
  try {
    if (!mol.is_valid()) throw new InvalidSmilesError(trimmed);
    const canonicalSmiles = mol.get_smiles();
    const doc = JSON.parse(mol.get_json()) as CommonChemDoc;
    const graph = graphFromCommonChem(doc);
    const svg = renderSvg(mol, options);
    return {
      inputSmiles: trimmed,
      canonicalSmiles,
      graph,
      svg,
      rdkitVersion: rdkit.version(),
    };
  } finally {
    mol.delete();
  }
}

function renderSvg(
  mol: RDKitMolLike,
  options: { showAtomIndices?: boolean; width?: number; height?: number },
): string {
  const width = options.width ?? 420;
  const height = options.height ?? 320;
  const details: Record<string, unknown> = {
    width,
    height,
    addAtomIndices: options.showAtomIndices ?? false,
    legend: '',
  };
  return mol.get_svg_with_highlights(JSON.stringify(details));
}

interface RDKitMolLike {
  get_svg_with_highlights(details: string): string;
}
