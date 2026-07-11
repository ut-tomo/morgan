// Core graph + refinement data model.
//
// These types deliberately keep the educational refinement fully transparent:
// signatures are *structured*, never ambiguous concatenated strings, and every
// integer identifier is assigned from an exact-tuple dictionary (no lossy hash).

/** A single heavy atom in the molecular graph. */
export interface AtomRecord {
  /** 0-based atom index, matching RDKit's atom ordering for the parsed mol. */
  index: number;
  /** Element symbol, e.g. "C", "O", "N". */
  element: string;
  /** Atomic number. */
  atomicNumber: number;
  /** Formal charge. */
  formalCharge: number;
  /** Number of implicit + explicit hydrogens attached. */
  totalHs: number;
  /** Heavy-atom degree (number of bonds to other heavy atoms). */
  degree: number;
  /** Whether RDKit perceived this atom as aromatic. */
  aromatic: boolean;
  /** True if the atom is part of any ring. */
  inRing: boolean;
}

/** A bond between two heavy atoms. */
export interface BondRecord {
  index: number;
  /** Atom index of one endpoint. */
  beginAtom: number;
  /** Atom index of the other endpoint. */
  endAtom: number;
  /**
   * Human-readable bond type used inside educational signatures:
   * "SINGLE" | "DOUBLE" | "TRIPLE" | "AROMATIC".
   */
  bondType: BondType;
  aromatic: boolean;
  inRing: boolean;
}

export type BondType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'AROMATIC';

/** The heavy-atom molecular graph extracted from RDKit for our own refinement. */
export interface MolecularGraph {
  atoms: AtomRecord[];
  bonds: BondRecord[];
  /** adjacency[i] = list of { neighbor atom index, bond index }. */
  adjacency: NeighborLink[][];
}

export interface NeighborLink {
  atom: number;
  bond: number;
}

/** Which transparent atom properties seed the educational initial invariant. */
export type InitialInvariantMode =
  | 'element'
  | 'element+degree'
  | 'element+degree+charge'
  | 'rdkit-inspired';

// ---------------------------------------------------------------------------
// WL-like structured signature
// ---------------------------------------------------------------------------

/** One (bond type, neighbor label) contribution to an atom's signature. */
export interface NeighborToken {
  bondType: BondType;
  neighborLabel: number;
}

/**
 * A structured, rooted signature for one atom in one round.
 * neighbors MUST be sorted deterministically before dictionary encoding.
 */
export interface AtomSignature {
  selfLabel: number;
  neighbors: NeighborToken[];
}

// ---------------------------------------------------------------------------
// Refinement rounds
// ---------------------------------------------------------------------------

/** Per-atom detail for a single WL-like refinement round. */
export interface AtomRoundDetail {
  atom: number;
  /** Label the atom held *before* this round. */
  previousLabel: number;
  /** The structured signature built from previous labels of self + neighbors. */
  signature: AtomSignature;
  /** Canonical JSON of the signature — used for dictionary lookup / debugging. */
  signatureKey: string;
  /** The integer label assigned to this atom *after* this round. */
  newLabel: number;
}

/** A full WL-like refinement round across all atoms. */
export interface RefinementRound {
  /** Round number: 0 = initial invariants, 1..r = refinement iterations. */
  round: number;
  /**
   * The radius of the rooted local environment that each atom's label now
   * summarizes. round r => radius r.
   */
  radius: number;
  details: AtomRoundDetail[];
  /** Number of distinct labels after this round (partition cell count). */
  distinctLabelCount: number;
  /**
   * Ordered list of the distinct signature keys introduced/seen this round,
   * paired with the integer id assigned — exposes the exact-tuple dictionary.
   */
  dictionary: DictionaryEntry[];
}

export interface DictionaryEntry {
  id: number;
  /** For round 0 this is the initial-invariant tuple key; else signatureKey. */
  key: string;
  /** How many atoms carry this label after the round. */
  count: number;
}

/** The complete educational WL-like refinement trace for a molecule. */
export interface WlRefinementResult {
  mode: InitialInvariantMode;
  /** rounds[0] holds the initial invariants; rounds[k] the k-th refinement. */
  rounds: RefinementRound[];
  /** Final label per atom (from the last computed round). */
  finalLabels: number[];
}

// ---------------------------------------------------------------------------
// Morgan 1965
// ---------------------------------------------------------------------------

/** One round of the classic 1965 connectivity (extended-connectivity) values. */
export interface Morgan1965Round {
  round: number;
  /** values[i] = the integer connectivity value of atom i after this round. */
  values: number[];
  /** Number of distinct values after this round. */
  distinctValueCount: number;
}

export interface Morgan1965Result {
  rounds: Morgan1965Round[];
  /**
   * The round at which the number of distinct values stopped increasing.
   * Morgan used this as the stopping criterion.
   */
  stabilizedAtRound: number;
}

// ---------------------------------------------------------------------------
// Circular environments & feature aggregation (educational)
// ---------------------------------------------------------------------------

/**
 * A circular, atom-centered environment identifier, produced from the WL-like
 * refinement. This is the educational analogue of a Morgan/ECFP feature.
 */
export interface EnvironmentFeature {
  /** The educational identifier for this environment (WL label at `radius`). */
  identifier: number;
  /** Circular radius this environment summarizes. */
  radius: number;
  /** How many times this (identifier, radius) feature occurs. */
  count: number;
  /** Atom indices that sit at the center of an occurrence. */
  centerAtoms: number[];
}

/**
 * A sparse educational fingerprint: the multiset of circular environment
 * features collected over the selected radii. This is NOT the RDKit output.
 */
export interface SparseFingerprint {
  mode: InitialInvariantMode;
  maxRadius: number;
  features: EnvironmentFeature[];
  /** Sum of all feature counts. */
  totalOccurrences: number;
}
