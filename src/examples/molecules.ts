// Curated molecule presets and comparison pairs.
//
// IMPORTANT: we never hard-code a claim that two real molecules "collide" or are
// "distinguishable at radius k" as fact. Comparison presets carry a *suggestion*
// of what to look for; the application computes the real RDKit result live, and
// the accompanying tests verify the pedagogical claims against RDKit.

export interface MoleculePreset {
  id: string;
  name: string;
  smiles: string;
  note?: string;
}

export interface PresetGroup {
  title: string;
  presets: MoleculePreset[];
}

export const PRESET_GROUPS: PresetGroup[] = [
  {
    title: 'Small molecules',
    presets: [
      { id: 'ethanol', name: 'Ethanol', smiles: 'CCO' },
      { id: 'propanol', name: '1-Propanol', smiles: 'CCCO' },
      { id: 'acetic-acid', name: 'Acetic acid', smiles: 'CC(=O)O' },
    ],
  },
  {
    title: 'Aromatics',
    presets: [
      { id: 'benzene', name: 'Benzene', smiles: 'c1ccccc1' },
      { id: 'pyridine', name: 'Pyridine', smiles: 'n1ccccc1' },
      {
        id: 'aspirin',
        name: 'Aspirin',
        smiles: 'CC(=O)Oc1ccccc1C(=O)O',
      },
    ],
  },
  {
    title: 'Teaching pairs',
    presets: [
      {
        id: 'ethanol-alt',
        name: 'Ethanol (alternative SMILES)',
        smiles: 'OCC',
        note: 'Same molecule as ethanol, written by a different traversal. RDKit canonicalizes both to CCO and the fingerprints are identical.',
      },
      {
        id: 'o-xylene',
        name: 'ortho-Xylene',
        smiles: 'Cc1ccccc1C',
        note: 'Radius-0 environments are identical to para-xylene; the two differ once the radius reaches 1.',
      },
      {
        id: 'p-xylene',
        name: 'para-Xylene',
        smiles: 'Cc1ccc(C)cc1',
        note: 'Radius-0 environments are identical to ortho-xylene; the two differ once the radius reaches 1.',
      },
    ],
  },
];

export const ALL_PRESETS: MoleculePreset[] = PRESET_GROUPS.flatMap(
  (g) => g.presets,
);

export function findPreset(id: string): MoleculePreset | undefined {
  return ALL_PRESETS.find((p) => p.id === id);
}

export interface ComparisonPreset {
  id: string;
  name: string;
  a: MoleculePreset;
  b: MoleculePreset;
  /** What the learner should look for — verified live / in tests, not asserted. */
  lookFor: string;
  suggestedRadius?: number;
}

const byId = (id: string): MoleculePreset => {
  const p = findPreset(id);
  if (!p) throw new Error(`unknown preset ${id}`);
  return p;
};

export const COMPARISON_PRESETS: ComparisonPreset[] = [
  {
    id: 'same-molecule',
    name: 'Same molecule, different SMILES',
    a: byId('ethanol'),
    b: byId('ethanol-alt'),
    lookFor:
      'RDKit canonicalizes both to CCO, so the fingerprints — and Tanimoto = 1.0 — are identical regardless of how the SMILES was written.',
  },
  {
    id: 'radius-dependent',
    name: 'Distinguishable only at higher radius',
    a: byId('o-xylene'),
    b: byId('p-xylene'),
    suggestedRadius: 0,
    lookFor:
      'At radius 0 the two fingerprints are equal. Raise the radius to 1 or more and they diverge, because the atoms differ only in their longer-range arrangement.',
  },
  {
    id: 'similar-alcohols',
    name: 'Similar but not identical',
    a: byId('ethanol'),
    b: byId('propanol'),
    lookFor:
      'A high but sub-1.0 Tanimoto: the molecules share many local environments but not all of them.',
  },
  {
    id: 'benzene-pyridine',
    name: 'Aromatic ring, one heteroatom',
    a: byId('benzene'),
    b: byId('pyridine'),
    lookFor:
      'Replacing one aromatic CH with N changes several local environments, lowering the Tanimoto similarity.',
  },
];
