// Types for the RDKit adapter boundary. UI code imports these; it never touches
// the raw RDKit module or its WebAssembly-backed JSMol objects.

import type { MolecularGraph } from '../refinement/types';

/** Minimal structural subset of the RDKit.js module that this app relies on. */
export interface RDKitMol {
  is_valid(): boolean;
  get_smiles(): string;
  get_json(): string;
  get_svg_with_highlights(details: string): string;
  get_svg(width: number, height: number): string;
  get_morgan_fp(options: string): string;
  delete(): void;
}

export interface RDKitModule {
  version(): string;
  get_mol(input: string, details_json?: string): RDKitMol | null;
  prefer_coordgen(prefer: boolean): void;
}

/** Parameters passed to RDKit's Morgan fingerprint generator. */
export interface MorganParams {
  radius: number;
  nBits: number;
}

/** A bit fingerprint returned by RDKit. */
export interface BitFingerprint {
  /** Exactly the parameters passed to RDKit. */
  params: MorganParams;
  /** Length of the bit vector (== params.nBits). */
  length: number;
  /** The raw '0'/'1' string returned by RDKit.js. */
  raw: string;
  /** Sorted indices of set bits. */
  setBits: number[];
  /** Population count. */
  popcount: number;
}

/**
 * The result of parsing + analyzing one molecule through the RDKit adapter.
 * Contains only plain data — all WASM objects have been deleted already.
 */
export interface MoleculeAnalysis {
  /** SMILES exactly as the user entered it. */
  inputSmiles: string;
  /** RDKit's canonical SMILES. */
  canonicalSmiles: string;
  /** Our heavy-atom graph extracted from RDKit. */
  graph: MolecularGraph;
  /** RDKit's rendered SVG (plain, with atom indices when requested). */
  svg: string;
  /** RDKit version string, for honest provenance labeling. */
  rdkitVersion: string;
}

/** Result of comparing two molecules' RDKit fingerprints + educational features. */
export interface MoleculeComparisonResult {
  tanimoto: number;
  /** Bits set in both A and B. */
  sharedBits: number[];
  /** Bits set only in A. */
  uniqueToA: number[];
  /** Bits set only in B. */
  uniqueToB: number[];
  /** Count of shared educational environment features (identifier+radius). */
  sharedEnvironmentCount: number;
  /** Educational features present only in A / only in B. */
  environmentsOnlyInA: number;
  environmentsOnlyInB: number;
}
