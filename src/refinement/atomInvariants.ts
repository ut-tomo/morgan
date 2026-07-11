// Initial atom invariants for the educational WL-like refinement.
//
// The invariant is *configurable* and fully transparent. Each mode builds an
// exact, human-readable tuple from atom properties; that tuple is what gets
// dictionary-encoded to an integer. We never claim the richer mode equals
// RDKit's internal invariant — it is only "RDKit-inspired".

import type { AtomRecord, InitialInvariantMode } from './types';

/** A transparent, ordered description of the fields that seed an atom label. */
export interface InvariantTuple {
  /** Ordered (field name, value) pairs — shown verbatim in the UI. */
  fields: Array<[string, string | number | boolean]>;
}

export function initialInvariant(
  atom: AtomRecord,
  mode: InitialInvariantMode,
): InvariantTuple {
  switch (mode) {
    case 'element':
      return { fields: [['element', atom.element]] };
    case 'element+degree':
      return {
        fields: [
          ['element', atom.element],
          ['degree', atom.degree],
        ],
      };
    case 'element+degree+charge':
      return {
        fields: [
          ['element', atom.element],
          ['degree', atom.degree],
          ['charge', atom.formalCharge],
        ],
      };
    case 'rdkit-inspired':
      // Inspired by RDKit's default connectivity invariants, but NOT verified
      // to be byte-for-byte identical. For teaching only.
      return {
        fields: [
          ['element', atom.element],
          ['degree', atom.degree],
          ['totalHs', atom.totalHs],
          ['charge', atom.formalCharge],
          ['aromatic', atom.aromatic],
          ['inRing', atom.inRing],
        ],
      };
  }
}

/** Canonical, unambiguous key for dictionary lookup. */
export function invariantKey(tuple: InvariantTuple): string {
  return tuple.fields.map(([k, v]) => `${k}=${String(v)}`).join(';');
}

/** Compact human-readable rendering, e.g. "C, deg 3, arom". */
export function describeInvariant(tuple: InvariantTuple): string {
  return tuple.fields.map(([k, v]) => `${k}:${String(v)}`).join(', ');
}

export const INITIAL_INVARIANT_MODES: Array<{
  value: InitialInvariantMode;
  label: string;
  description: string;
}> = [
  {
    value: 'element',
    label: 'Element only',
    description: 'Every atom of the same element starts identical.',
  },
  {
    value: 'element+degree',
    label: 'Element + degree',
    description: 'Element plus heavy-atom degree.',
  },
  {
    value: 'element+degree+charge',
    label: 'Element + degree + charge',
    description: 'Element, heavy-atom degree, and formal charge.',
  },
  {
    value: 'rdkit-inspired',
    label: 'RDKit-inspired (richer)',
    description:
      'Element, degree, H count, charge, aromaticity, ring membership. Inspired by RDKit — not verified identical.',
  },
];
