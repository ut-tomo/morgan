// Morgan's 1965 connectivity refinement (the "extended connectivity" values).
//
// Initial value: heavy-atom degree.
// Update:        new value(atom) = sum of neighbours' current values.
// Stopping:      Morgan iterated while the number of DISTINCT values kept
//                increasing, using the resulting values as a partial ordering to
//                reduce the canonicalization search. These values are NOT the
//                final fingerprint.

import { countDistinct, neighbors } from './graph';
import type { Morgan1965Result, Morgan1965Round, MolecularGraph } from './types';

export function runMorgan1965(
  graph: MolecularGraph,
  maxRounds = graph.atoms.length + 2,
): Morgan1965Result {
  const rounds: Morgan1965Round[] = [];

  // Round 0: initial connectivity = heavy-atom degree.
  let values = graph.atoms.map((a) => a.degree);
  rounds.push({
    round: 0,
    values: [...values],
    distinctValueCount: countDistinct(values),
  });

  let stabilizedAtRound = 0;
  for (let round = 1; round <= maxRounds; round++) {
    const prev = values;
    const next = graph.atoms.map((_, i) =>
      neighbors(graph, i).reduce((sum, link) => sum + prev[link.atom]!, 0),
    );
    const distinct = countDistinct(next);
    rounds.push({ round, values: next, distinctValueCount: distinct });
    values = next;

    const prevDistinct = rounds[round - 1]!.distinctValueCount;
    if (distinct <= prevDistinct) {
      // The count stopped increasing: the previous round holds the stable
      // partition Morgan would have used.
      stabilizedAtRound = round - 1;
      break;
    }
    stabilizedAtRound = round;
  }

  return { rounds, stabilizedAtRound };
}
