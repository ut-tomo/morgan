import { describe, it, expect } from 'vitest';
import { tanimoto, tanimotoFromBits } from '../similarity/tanimoto';

describe('Tanimoto similarity', () => {
  it('computes intersection / union', () => {
    const a = [1, 2, 3, 4];
    const b = [3, 4, 5];
    // intersection = {3,4} = 2; union = 4 + 3 - 2 = 5.
    expect(tanimoto(a, b)).toBeCloseTo(2 / 5, 10);
  });

  it('is 1.0 for identical bit sets', () => {
    expect(tanimoto([1, 5, 9], [1, 5, 9])).toBe(1);
  });

  it('is 0 for disjoint sets', () => {
    expect(tanimoto([1, 2], [3, 4])).toBe(0);
  });

  it('handles the all-zero case explicitly as 1.0 and flags it', () => {
    const r = tanimotoFromBits([], []);
    expect(r.tanimoto).toBe(1);
    expect(r.bothEmpty).toBe(true);
  });

  it('reports onlyA / onlyB / intersection consistently', () => {
    const r = tanimotoFromBits([1, 2, 3], [2, 3, 4, 5]);
    expect(r.intersection).toBe(2);
    expect(r.onlyA).toBe(1);
    expect(r.onlyB).toBe(2);
    expect(r.popcountA).toBe(3);
    expect(r.popcountB).toBe(4);
  });
});
