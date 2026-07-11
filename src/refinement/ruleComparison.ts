// Pure helper contrasting Morgan's neighbour-SUM update with 1-WL's
// neighbour-MULTISET update. Used by the UI and unit-tested.

export interface SumVsMultiset {
  a: number[];
  b: number[];
  sumA: number;
  sumB: number;
  sumsEqual: boolean;
  multisetsEqual: boolean;
}

function multisetKey(values: number[]): string {
  return values.slice().sort((x, y) => x - y).join(',');
}

/**
 * Compare two neighbour-value lists under both update rules. The interesting
 * case is `sumsEqual && !multisetsEqual`: the sum merges the two neighbourhoods
 * while the multiset (1-WL) keeps them apart — showing the neighbour-sum can
 * lose information the multiset retains.
 */
export function sumVsMultiset(a: number[], b: number[]): SumVsMultiset {
  const sumA = a.reduce((s, v) => s + v, 0);
  const sumB = b.reduce((s, v) => s + v, 0);
  return {
    a,
    b,
    sumA,
    sumB,
    sumsEqual: sumA === sumB,
    multisetsEqual: multisetKey(a) === multisetKey(b),
  };
}
