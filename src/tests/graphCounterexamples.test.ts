import { describe, it, expect } from 'vitest';
import {
  TRIANGULAR_PRISM,
  K33,
  compareUnderWl,
  triangleCount,
} from '../examples/graphCounterexamples';

describe('1-WL limitation counterexample', () => {
  it('cannot distinguish the triangular prism from K(3,3)', () => {
    const { histogramsMatch } = compareUnderWl(TRIANGULAR_PRISM, K33, 5);
    // Both are 3-regular; with uniform labels 1-WL never separates them.
    expect(histogramsMatch).toBe(true);
  });

  it('leaves every vertex in a single color class (stable, all-equal)', () => {
    const { a } = compareUnderWl(TRIANGULAR_PRISM, K33, 4);
    const last = a.at(-1)!;
    expect(last.histogram.length).toBe(1);
    expect(last.histogram[0]!.count).toBe(6);
  });

  it('but a triangle count DOES prove they are non-isomorphic', () => {
    // The prism has two triangular faces; K(3,3) is bipartite and triangle-free.
    expect(triangleCount(TRIANGULAR_PRISM)).toBe(2);
    expect(triangleCount(K33)).toBe(0);
    expect(triangleCount(TRIANGULAR_PRISM)).not.toBe(triangleCount(K33));
  });
});
