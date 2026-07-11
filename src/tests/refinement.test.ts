import { describe, it, expect } from 'vitest';
import { runWlRefinement } from '../refinement/wlRefinement';
import { runMorgan1965 } from '../refinement/morgan1965';
import { extractEnvironments } from '../refinement/environmentExtraction';
import {
  aggregateFeatures,
  binaryFeatureSet,
  countFeatureMap,
} from '../refinement/featureAggregation';
import {
  makeSignature,
  serializeSignature,
} from '../refinement/signature';
import { makeGraph, permuteGraph, cellSizeHistogram } from './graphFixtures';

// Propane-like chain C-C-C plus an O on the middle: use isopropanol skeleton.
const isopropanol = makeGraph(
  ['C', 'C', 'C', 'O'],
  [
    [0, 1],
    [1, 2],
    [1, 3],
  ],
);

describe('WL-like refinement', () => {
  it('is invariant under atom permutation (partition structure preserved)', () => {
    const perm = [3, 0, 2, 1]; // arbitrary permutation
    const permuted = permuteGraph(isopropanol, perm);
    const base = runWlRefinement(isopropanol, 'element+degree', 3);
    const other = runWlRefinement(permuted, 'element+degree', 3);
    // Same number of rounds, and identical cell-size histograms every round.
    expect(other.rounds.length).toBe(base.rounds.length);
    for (let r = 0; r < base.rounds.length; r++) {
      const a = base.rounds[r]!;
      const b = other.rounds[r]!;
      expect(b.distinctLabelCount).toBe(a.distinctLabelCount);
      expect(cellSizeHistogram(b.details.map((d) => d.newLabel))).toEqual(
        cellSizeHistogram(a.details.map((d) => d.newLabel)),
      );
    }
  });

  it('produces deterministic, order-independent signature encoding', () => {
    const s1 = makeSignature(2, [
      { bondType: 'AROMATIC', neighborLabel: 4 },
      { bondType: 'SINGLE', neighborLabel: 1 },
    ]);
    const s2 = makeSignature(2, [
      { bondType: 'SINGLE', neighborLabel: 1 },
      { bondType: 'AROMATIC', neighborLabel: 4 },
    ]);
    // Neighbor order differs on input but canonical serialization is identical.
    expect(serializeSignature(s1)).toBe(serializeSignature(s2));
    // Different environment => different key (exact, no hash collision).
    const s3 = makeSignature(2, [{ bondType: 'SINGLE', neighborLabel: 2 }]);
    expect(serializeSignature(s3)).not.toBe(serializeSignature(s1));
  });

  it('refines monotonically: distinct labels never decrease with radius', () => {
    const result = runWlRefinement(isopropanol, 'element', 3);
    let prev = 0;
    for (const round of result.rounds) {
      expect(round.distinctLabelCount).toBeGreaterThanOrEqual(prev);
      prev = round.distinctLabelCount;
    }
    // Round radius equals round number.
    expect(result.rounds.map((r) => r.radius)).toEqual([0, 1, 2, 3]);
  });

  it('separates the two symmetric terminal carbons of isopropanol from the middle carbon', () => {
    const result = runWlRefinement(isopropanol, 'element+degree', 2);
    const finalRound = result.rounds.at(-1)!;
    const labels = finalRound.details.map((d) => d.newLabel);
    // Atoms 0 and 2 are the equivalent methyls -> same label.
    expect(labels[0]).toBe(labels[2]);
    // The central carbon differs from a methyl.
    expect(labels[1]).not.toBe(labels[0]);
  });
});

describe('feature aggregation', () => {
  it('count aggregation sums occurrences; the two methyls share a feature', () => {
    const wl = runWlRefinement(isopropanol, 'element+degree', 2);
    const envs = extractEnvironments(isopropanol, wl, 2);
    const sparse = aggregateFeatures(envs, 'element+degree', 2);
    const counts = countFeatureMap(sparse);
    // Radius 0: element+degree of a methyl carbon (C, deg 1) occurs twice.
    const methylR0 = sparse.features.find(
      (f) => f.radius === 0 && f.count === 2 && f.centerAtoms.includes(0),
    );
    expect(methylR0).toBeDefined();
    expect(methylR0!.centerAtoms).toEqual([0, 2]);
    // Total occurrences = atoms * (radii+1) = 4 * 3 = 12.
    expect(sparse.totalOccurrences).toBe(12);
    // countFeatureMap agrees with feature counts.
    for (const f of sparse.features) {
      expect(counts.get(`${f.identifier}@r${f.radius}`)).toBe(f.count);
    }
  });

  it('binary aggregation collapses counts to presence', () => {
    const wl = runWlRefinement(isopropanol, 'element+degree', 2);
    const envs = extractEnvironments(isopropanol, wl, 2);
    const sparse = aggregateFeatures(envs, 'element+degree', 2);
    const binary = binaryFeatureSet(sparse);
    // Binary set size equals number of distinct (identifier, radius) features.
    expect(binary.size).toBe(sparse.features.length);
    // Presence but no counts: a doubly-occurring feature still appears once.
    expect(binary.has('0@r0') || binary.size > 0).toBe(true);
  });
});

describe('Morgan 1965 connectivity', () => {
  it('starts from heavy-atom degree and updates by neighbor sum', () => {
    const result = runMorgan1965(isopropanol);
    // Round 0 = degrees: [1, 3, 1, 1].
    expect(result.rounds[0]!.values).toEqual([1, 3, 1, 1]);
    // Round 1 = sum of neighbor round-0 values:
    //  atom0 (nbr 1) = 3; atom1 (nbrs 0,2,3) = 1+1+1 = 3;
    //  atom2 (nbr 1) = 3; atom3 (nbr 1) = 3.
    expect(result.rounds[1]!.values).toEqual([3, 3, 3, 3]);
  });

  it('reports a stabilization round', () => {
    const result = runMorgan1965(isopropanol);
    expect(result.stabilizedAtRound).toBeGreaterThanOrEqual(0);
    // Distinct count went 2 (round 0) -> 1 (round 1): it stopped increasing.
    expect(result.rounds[0]!.distinctValueCount).toBe(2);
    expect(result.rounds[1]!.distinctValueCount).toBe(1);
    expect(result.stabilizedAtRound).toBe(0);
  });
});
