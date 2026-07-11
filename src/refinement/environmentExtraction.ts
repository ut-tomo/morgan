// Extract circular, atom-centered environments from the WL-like refinement.
//
// After WL round r, each atom's label summarizes its rooted environment out to
// radius r. A "circular environment" pairs that identifier with the actual set
// of atoms/bonds inside the ball of that radius — exactly the kind of
// atom-centered feature a Morgan/ECFP fingerprint collects (these are circular
// neighbourhoods, NOT arbitrary subgraphs).

import { environmentBall } from './graph';
import type { MolecularGraph, WlRefinementResult } from './types';

export interface CircularEnvironment {
  center: number;
  radius: number;
  /** Educational WL identifier of this rooted environment. */
  identifier: number;
  atoms: number[];
  bonds: number[];
}

export function extractEnvironments(
  graph: MolecularGraph,
  wl: WlRefinementResult,
  maxRadius: number,
): CircularEnvironment[] {
  const out: CircularEnvironment[] = [];
  const limit = Math.min(maxRadius, wl.rounds.length - 1);
  for (let radius = 0; radius <= limit; radius++) {
    const round = wl.rounds[radius]!;
    for (const detail of round.details) {
      const ball = environmentBall(graph, detail.atom, radius);
      out.push({
        center: detail.atom,
        radius,
        identifier: detail.newLabel,
        atoms: ball.atoms,
        bonds: ball.bonds,
      });
    }
  }
  return out;
}
