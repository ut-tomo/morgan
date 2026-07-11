// Generic-graph counterexamples for the 1-WL limitation lesson.
//
// The triangular prism and the complete bipartite graph K(3,3) are both
// 3-regular on 6 vertices. With uniform initial labels, 1-WL assigns every
// vertex the same color forever, so it CANNOT distinguish them — yet they are
// non-isomorphic (the prism contains triangles; K(3,3) is bipartite and
// triangle-free). This demonstrates:
//   "1-WL failing to distinguish two graphs does NOT prove they are isomorphic."
//
// This is a graph-theory example, NOT a claim about ordinary stable molecules.

import { LabelDictionary } from '../refinement/graph';

export interface GenericGraph {
  name: string;
  description: string;
  nodeCount: number;
  /** Undirected edges as [u, v] pairs. */
  edges: Array<[number, number]>;
}

// Prism: two triangles {0,1,2} and {3,4,5} joined 0-3, 1-4, 2-5.
export const TRIANGULAR_PRISM: GenericGraph = {
  name: 'Triangular prism',
  description:
    'Two triangles (0-1-2 and 3-4-5) connected by three rungs. 3-regular, contains 3-cycles.',
  nodeCount: 6,
  edges: [
    [0, 1],
    [1, 2],
    [2, 0],
    [3, 4],
    [4, 5],
    [5, 3],
    [0, 3],
    [1, 4],
    [2, 5],
  ],
};

// K(3,3): complete bipartite between {0,1,2} and {3,4,5}.
export const K33: GenericGraph = {
  name: 'K(3,3)',
  description:
    'Complete bipartite graph between {0,1,2} and {3,4,5}. 3-regular, bipartite, triangle-free.',
  nodeCount: 6,
  edges: [
    [0, 3],
    [0, 4],
    [0, 5],
    [1, 3],
    [1, 4],
    [1, 5],
    [2, 3],
    [2, 4],
    [2, 5],
  ],
};

function adjacency(graph: GenericGraph): number[][] {
  const adj: number[][] = Array.from({ length: graph.nodeCount }, () => []);
  for (const [u, v] of graph.edges) {
    adj[u]!.push(v);
    adj[v]!.push(u);
  }
  for (const list of adj) list.sort((a, b) => a - b);
  return adj;
}

export interface GenericWlRound {
  round: number;
  /** Color id per vertex. */
  colors: number[];
  /** Sorted color -> count histogram (this is what WL actually compares). */
  histogram: Array<{ color: number; count: number }>;
}

/**
 * Run 1-WL on a generic graph with UNIFORM initial labels.
 * Update rule: new color = dictionary( ownColor, sorted multiset of neighbor colors ).
 */
export function refineGenericGraph(
  graph: GenericGraph,
  rounds: number,
  dict: LabelDictionary = new LabelDictionary(),
): GenericWlRound[] {
  const adj = adjacency(graph);
  const out: GenericWlRound[] = [];

  // Uniform initial label.
  let colors = new Array<number>(graph.nodeCount).fill(dict.encode('uniform'));
  out.push({ round: 0, colors: [...colors], histogram: histogram(colors) });

  for (let r = 1; r <= rounds; r++) {
    const prev = colors;
    colors = prev.map((_, v) => {
      const nbrColors = adj[v]!.map((n) => prev[n]!).sort((a, b) => a - b);
      const key = JSON.stringify({ self: prev[v], nbrs: nbrColors });
      return dict.encode(key);
    });
    out.push({ round: r, colors: [...colors], histogram: histogram(colors) });
  }
  return out;
}

function histogram(colors: number[]): Array<{ color: number; count: number }> {
  const m = new Map<number, number>();
  for (const c of colors) m.set(c, (m.get(c) ?? 0) + 1);
  return [...m.entries()]
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => a.color - b.color);
}

/** Count triangles (3-cycles) — an invariant that DOES separate the two graphs. */
export function triangleCount(graph: GenericGraph): number {
  const adj = adjacency(graph).map((l) => new Set(l));
  let count = 0;
  const n = graph.nodeCount;
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      if (!adj[a]!.has(b)) continue;
      for (let c = b + 1; c < n; c++) {
        if (adj[a]!.has(c) && adj[b]!.has(c)) count += 1;
      }
    }
  }
  return count;
}

/**
 * Compare two graphs under shared-dictionary 1-WL. If their color histograms
 * match at every round, 1-WL cannot tell them apart.
 */
export function compareUnderWl(
  a: GenericGraph,
  b: GenericGraph,
  rounds: number,
): {
  a: GenericWlRound[];
  b: GenericWlRound[];
  histogramsMatch: boolean;
} {
  const dict = new LabelDictionary();
  const ra = refineGenericGraph(a, rounds, dict);
  const rb = refineGenericGraph(b, rounds, dict);
  let match = ra.length === rb.length;
  for (let i = 0; i < ra.length && match; i++) {
    match = sameHistogram(ra[i]!.histogram, rb[i]!.histogram);
  }
  return { a: ra, b: rb, histogramsMatch: match };
}

function sameHistogram(
  x: Array<{ color: number; count: number }>,
  y: Array<{ color: number; count: number }>,
): boolean {
  if (x.length !== y.length) return false;
  return x.every((e, i) => e.color === y[i]!.color && e.count === y[i]!.count);
}
