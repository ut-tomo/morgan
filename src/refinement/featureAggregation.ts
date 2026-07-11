// Aggregate circular environments into an educational sparse fingerprint.
//
// Two aggregation policies are exposed:
//   - count:  multiset — how many times each (identifier, radius) feature occurs.
//   - binary: set      — whether each feature is present at all.
// This mirrors the count-vs-binary choice real fingerprints expose, while
// keeping every feature fully traceable back to its center atoms.

import type {
  CircularEnvironment,
} from './environmentExtraction';
import type {
  EnvironmentFeature,
  InitialInvariantMode,
  SparseFingerprint,
} from './types';

/** Stable key for a (identifier, radius) feature. */
export function featureKey(identifier: number, radius: number): string {
  return `${identifier}@r${radius}`;
}

export function aggregateFeatures(
  environments: CircularEnvironment[],
  mode: InitialInvariantMode,
  maxRadius: number,
): SparseFingerprint {
  const byKey = new Map<string, EnvironmentFeature>();
  for (const env of environments) {
    const key = featureKey(env.identifier, env.radius);
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
      existing.centerAtoms.push(env.center);
    } else {
      byKey.set(key, {
        identifier: env.identifier,
        radius: env.radius,
        count: 1,
        centerAtoms: [env.center],
      });
    }
  }
  const features = [...byKey.values()].sort(
    (a, b) => a.radius - b.radius || a.identifier - b.identifier,
  );
  for (const f of features) f.centerAtoms.sort((a, b) => a - b);
  const totalOccurrences = features.reduce((s, f) => s + f.count, 0);
  return { mode, maxRadius, features, totalOccurrences };
}

/** Binary aggregation: the set of feature keys that are present (count ignored). */
export function binaryFeatureSet(fp: SparseFingerprint): Set<string> {
  return new Set(fp.features.map((f) => featureKey(f.identifier, f.radius)));
}

/** Count aggregation as a plain map feature-key -> count. */
export function countFeatureMap(fp: SparseFingerprint): Map<string, number> {
  return new Map(fp.features.map((f) => [featureKey(f.identifier, f.radius), f.count]));
}
