// Educational 1-WL-style vertex refinement.
//
// Round 0 assigns initial invariants. Each subsequent round rebuilds every
// atom's label from a STRUCTURED signature: its current label plus the sorted
// multiset of (bond type, neighbor's current label) tokens. Integer ids come
// from an exact-tuple dictionary — no lossy hashing — so the encoding is fully
// reversible and inspectable.
//
// After round r, an atom's label summarizes its rooted local environment out to
// radius r. This is the educational analogue of the identifiers that circular
// (Morgan/ECFP) fingerprints collect.

import {
  describeInvariant,
  initialInvariant,
  invariantKey,
} from './atomInvariants';
import { countDistinct, LabelDictionary, neighbors } from './graph';
import {
  describeSignature,
  makeSignature,
  serializeSignature,
} from './signature';
import type {
  AtomRoundDetail,
  DictionaryEntry,
  InitialInvariantMode,
  MolecularGraph,
  NeighborToken,
  RefinementRound,
  WlRefinementResult,
} from './types';

export function runWlRefinement(
  graph: MolecularGraph,
  mode: InitialInvariantMode,
  maxRadius: number,
): WlRefinementResult {
  const dict = new LabelDictionary();
  const rounds: RefinementRound[] = [];

  // ---- Round 0: initial invariants -------------------------------------
  let labels = graph.atoms.map((atom) => {
    const tuple = initialInvariant(atom, mode);
    return dict.encode(invariantKey(tuple));
  });

  {
    const details: AtomRoundDetail[] = graph.atoms.map((atom, i) => {
      const tuple = initialInvariant(atom, mode);
      const id = labels[i]!;
      return {
        atom: i,
        previousLabel: id,
        signature: { selfLabel: id, neighbors: [] },
        signatureKey: describeInvariant(tuple),
        newLabel: id,
      };
    });
    rounds.push({
      round: 0,
      radius: 0,
      details,
      distinctLabelCount: countDistinct(labels),
      dictionary: buildDictionary(
        graph.atoms.map((atom) => describeInvariant(initialInvariant(atom, mode))),
        labels,
      ),
    });
  }

  // ---- Rounds 1..maxRadius: WL refinement ------------------------------
  for (let round = 1; round <= maxRadius; round++) {
    const prev = labels;
    const details: AtomRoundDetail[] = [];
    const roundKeys: string[] = [];
    const newLabels: number[] = new Array(graph.atoms.length);

    for (let i = 0; i < graph.atoms.length; i++) {
      const tokens: NeighborToken[] = neighbors(graph, i).map((link) => ({
        bondType: graph.bonds[link.bond]!.bondType,
        neighborLabel: prev[link.atom]!,
      }));
      const signature = makeSignature(prev[i]!, tokens);
      const key = serializeSignature(signature);
      const newLabel = dict.encode(key);
      newLabels[i] = newLabel;
      roundKeys.push(key);
      details.push({
        atom: i,
        previousLabel: prev[i]!,
        signature,
        signatureKey: key,
        newLabel,
      });
    }

    labels = newLabels;
    rounds.push({
      round,
      radius: round,
      details,
      distinctLabelCount: countDistinct(labels),
      dictionary: buildDictionary(roundKeys, labels, (key) =>
        describeSignatureKey(key),
      ),
    });
  }

  return { mode, rounds, finalLabels: labels };
}

function describeSignatureKey(key: string): string {
  try {
    const parsed = JSON.parse(key) as {
      self: number;
      nbrs: Array<[string, number]>;
    };
    return describeSignature({
      selfLabel: parsed.self,
      neighbors: parsed.nbrs.map(([bondType, neighborLabel]) => ({
        bondType: bondType as NeighborToken['bondType'],
        neighborLabel,
      })),
    });
  } catch {
    return key;
  }
}

/** Build the per-round dictionary view: id -> key + occurrence count. */
function buildDictionary(
  keysByAtom: string[],
  labelsByAtom: number[],
  describe?: (key: string) => string,
): DictionaryEntry[] {
  const byId = new Map<number, { key: string; count: number }>();
  for (let i = 0; i < labelsByAtom.length; i++) {
    const id = labelsByAtom[i]!;
    const key = keysByAtom[i]!;
    const entry = byId.get(id);
    if (entry) entry.count += 1;
    else byId.set(id, { key: describe ? describe(key) : key, count: 1 });
  }
  return [...byId.entries()]
    .map(([id, { key, count }]) => ({ id, key, count }))
    .sort((a, b) => a.id - b.id);
}
