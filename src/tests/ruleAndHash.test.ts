import { describe, it, expect } from 'vitest';
import { sumVsMultiset } from '../refinement/ruleComparison';
import { fnv1a, findHashCollision, firstCollisionAtModulus } from '../refinement/hashCollision';

describe('sum vs multiset refinement rule', () => {
  it('the canonical example: same sum, different multiset', () => {
    const r = sumVsMultiset([1, 3], [2, 2]);
    expect(r.sumA).toBe(4);
    expect(r.sumB).toBe(4);
    expect(r.sumsEqual).toBe(true);
    // The multisets differ -> 1-WL separates what the neighbour-sum merges.
    expect(r.multisetsEqual).toBe(false);
  });

  it('identical multisets agree on both rules', () => {
    const r = sumVsMultiset([2, 3, 5], [5, 2, 3]);
    expect(r.sumsEqual).toBe(true);
    expect(r.multisetsEqual).toBe(true);
  });
});

describe('toy environment-identifier hashing (mechanism 3)', () => {
  it('fnv1a is deterministic and returns an unsigned 32-bit int', () => {
    const h = fnv1a('self=2 · [SINGLE→1]');
    expect(h).toBe(fnv1a('self=2 · [SINGLE→1]'));
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });

  it('finds a genuine collision: two DISTINCT signatures, same bucket', () => {
    // More distinct signatures than buckets => pigeonhole guarantees a collision.
    const sigs = Array.from({ length: 40 }, (_, i) => `signature#${i}`);
    const hit = findHashCollision(sigs, 8);
    expect(hit).not.toBeNull();
    expect(hit!.a).not.toBe(hit!.b);
    expect(fnv1a(hit!.a) % 8).toBe(hit!.bucket);
    expect(fnv1a(hit!.b) % 8).toBe(hit!.bucket);
  });

  it('reports no collision when the space is large enough to be injective', () => {
    const sigs = ['a', 'b', 'c'];
    // With a huge modulus these three are extremely unlikely to collide.
    expect(findHashCollision(sigs, 2 ** 31)).toBeNull();
  });

  it('firstCollisionAtModulus surfaces the smallest tested colliding space', () => {
    const sigs = Array.from({ length: 20 }, (_, i) => `env-${i}`);
    const hit = firstCollisionAtModulus(sigs, [8, 16, 32]);
    expect(hit).not.toBeNull();
    expect(hit!.modulus).toBe(8);
  });
});
