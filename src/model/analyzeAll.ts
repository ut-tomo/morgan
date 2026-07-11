// Orchestration layer: given the RDKit module + a SMILES + settings, produce the
// complete data model the UI renders. This is the ONLY place that combines the
// RDKit adapter with the transparent educational refinement, keeping both the
// UI and the individual modules simple.

import { analyzeMolecule } from '../rdkit/molecule';
import { computeRdkitMorgan } from '../rdkit/fingerprint';
import type { BitFingerprint, MoleculeAnalysis, MoleculeComparisonResult, RDKitModule } from '../rdkit/types';
import { runWlRefinement } from '../refinement/wlRefinement';
import { runMorgan1965 } from '../refinement/morgan1965';
import { extractEnvironments, type CircularEnvironment } from '../refinement/environmentExtraction';
import { aggregateFeatures, binaryFeatureSet } from '../refinement/featureAggregation';
import { LabelDictionary } from '../refinement/graph';
import type {
  InitialInvariantMode,
  Morgan1965Result,
  SparseFingerprint,
  WlRefinementResult,
} from '../refinement/types';
import { tanimotoFromBits } from '../similarity/tanimoto';

export interface AnalysisSettings {
  showAtomIndices: boolean;
  invariantMode: InitialInvariantMode;
  radius: number;
  nBits: number;
}

export const DEFAULT_SETTINGS: AnalysisSettings = {
  showAtomIndices: true,
  invariantMode: 'rdkit-inspired',
  radius: 2,
  nBits: 2048,
};

export interface FullAnalysis {
  settings: AnalysisSettings;
  molecule: MoleculeAnalysis;
  wl: WlRefinementResult;
  morgan1965: Morgan1965Result;
  environments: CircularEnvironment[];
  sparse: SparseFingerprint;
  rdkitFp: BitFingerprint;
}

export function analyzeEverything(
  rdkit: RDKitModule,
  smiles: string,
  settings: AnalysisSettings,
): FullAnalysis {
  const molecule = analyzeMolecule(rdkit, smiles, {
    showAtomIndices: settings.showAtomIndices,
  });
  const wl = runWlRefinement(molecule.graph, settings.invariantMode, settings.radius);
  const morgan1965 = runMorgan1965(molecule.graph);
  const environments = extractEnvironments(molecule.graph, wl, settings.radius);
  const sparse = aggregateFeatures(environments, settings.invariantMode, settings.radius);
  const rdkitFp = computeRdkitMorgan(rdkit, smiles, {
    radius: settings.radius,
    nBits: settings.nBits,
  });
  return { settings, molecule, wl, morgan1965, environments, sparse, rdkitFp };
}

export function compareAnalyses(
  a: FullAnalysis,
  b: FullAnalysis,
): MoleculeComparisonResult {
  const t = tanimotoFromBits(a.rdkitFp.setBits, b.rdkitFp.setBits);
  const setA = new Set(a.rdkitFp.setBits);
  const setB = new Set(b.rdkitFp.setBits);
  const sharedBits: number[] = [];
  const uniqueToA: number[] = [];
  const uniqueToB: number[] = [];
  for (const bit of setA) (setB.has(bit) ? sharedBits : uniqueToA).push(bit);
  for (const bit of setB) if (!setA.has(bit)) uniqueToB.push(bit);
  sharedBits.sort((x, y) => x - y);
  uniqueToA.sort((x, y) => x - y);
  uniqueToB.sort((x, y) => x - y);

  // Educational environment overlap must be COMPARABLE across molecules. The
  // per-molecule sparse fingerprints (a.sparse / b.sparse) use independent
  // dictionaries, so their integer ids are NOT comparable — id 3 in A is
  // unrelated to id 3 in B. We therefore re-run the WL refinement for BOTH
  // graphs sharing ONE dictionary, so identical rooted environments receive
  // identical identifiers and (identifier, radius) keys can be intersected.
  const sharedDict = new LabelDictionary();
  const radius = a.settings.radius;
  const mode = a.settings.invariantMode;
  const wlA = runWlRefinement(a.molecule.graph, mode, radius, sharedDict);
  const wlB = runWlRefinement(b.molecule.graph, mode, radius, sharedDict);
  const featA = binaryFeatureSet(
    aggregateFeatures(extractEnvironments(a.molecule.graph, wlA, radius), mode, radius),
  );
  const featB = binaryFeatureSet(
    aggregateFeatures(extractEnvironments(b.molecule.graph, wlB, radius), mode, radius),
  );
  let sharedEnvironmentCount = 0;
  let environmentsOnlyInA = 0;
  for (const f of featA) (featB.has(f) ? (sharedEnvironmentCount += 1) : (environmentsOnlyInA += 1));
  let environmentsOnlyInB = 0;
  for (const f of featB) if (!featA.has(f)) environmentsOnlyInB += 1;

  return {
    tanimoto: t.tanimoto,
    sharedBits,
    uniqueToA,
    uniqueToB,
    sharedEnvironmentCount,
    environmentsOnlyInA,
    environmentsOnlyInB,
  };
}
