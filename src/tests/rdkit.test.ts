import { describe, it, expect, beforeAll } from 'vitest';
import type { RDKitModule } from '../rdkit/types';
import { getTestRDKit } from './rdkitTestHelper';
import { analyzeMolecule } from '../rdkit/molecule';
import { computeRdkitMorgan } from '../rdkit/fingerprint';

let rdkit: RDKitModule;
beforeAll(async () => {
  rdkit = await getTestRDKit();
});

describe('RDKit adapter — molecule parsing', () => {
  it('parses ethanol into a 3-heavy-atom graph with correct elements', () => {
    const a = analyzeMolecule(rdkit, 'CCO');
    expect(a.canonicalSmiles).toBe('CCO');
    expect(a.graph.atoms.map((x) => x.element)).toEqual(['C', 'C', 'O']);
    expect(a.graph.atoms.map((x) => x.degree)).toEqual([1, 2, 1]);
    expect(a.svg).toContain('<svg');
  });

  it('detects aromaticity and ring membership for benzene', () => {
    const a = analyzeMolecule(rdkit, 'c1ccccc1');
    expect(a.graph.atoms.every((x) => x.aromatic)).toBe(true);
    expect(a.graph.atoms.every((x) => x.inRing)).toBe(true);
    expect(a.graph.bonds.every((b) => b.bondType === 'AROMATIC')).toBe(true);
  });

  it('throws on invalid SMILES', () => {
    expect(() => analyzeMolecule(rdkit, 'not-a-molecule)))')).toThrow();
  });
});

describe('RDKit Morgan fingerprint (real RDKit output)', () => {
  it('gives identical fingerprints for the same molecule from alternative SMILES', () => {
    const a = computeRdkitMorgan(rdkit, 'CCO', { radius: 2, nBits: 2048 });
    const b = computeRdkitMorgan(rdkit, 'OCC', { radius: 2, nBits: 2048 });
    expect(b.setBits).toEqual(a.setBits);
    expect(b.popcount).toBe(a.popcount);
  });

  it('changing the radius changes the output for at least one preset', () => {
    const r0 = computeRdkitMorgan(rdkit, 'CC(=O)Oc1ccccc1C(=O)O', {
      radius: 0,
      nBits: 2048,
    });
    const r2 = computeRdkitMorgan(rdkit, 'CC(=O)Oc1ccccc1C(=O)O', {
      radius: 2,
      nBits: 2048,
    });
    expect(r2.setBits).not.toEqual(r0.setBits);
    expect(r2.popcount).toBeGreaterThan(r0.popcount);
  });

  it('reports the exact parameters and vector length RDKit was given', () => {
    const fp = computeRdkitMorgan(rdkit, 'CCO', { radius: 2, nBits: 512 });
    expect(fp.length).toBe(512);
    expect(fp.params).toEqual({ radius: 2, nBits: 512 });
    expect(fp.raw.length).toBe(512);
  });

  it('the o-xylene / p-xylene pair is equal at radius 0 but differs at radius 1', () => {
    const o0 = computeRdkitMorgan(rdkit, 'Cc1ccccc1C', { radius: 0, nBits: 2048 });
    const p0 = computeRdkitMorgan(rdkit, 'Cc1ccc(C)cc1', { radius: 0, nBits: 2048 });
    expect(o0.setBits).toEqual(p0.setBits);
    const o1 = computeRdkitMorgan(rdkit, 'Cc1ccccc1C', { radius: 1, nBits: 2048 });
    const p1 = computeRdkitMorgan(rdkit, 'Cc1ccc(C)cc1', { radius: 1, nBits: 2048 });
    expect(o1.setBits).not.toEqual(p1.setBits);
  });
});

describe('bit-folding collision fixture (verified against RDKit)', () => {
  it('folds aspirin into fewer set bits at nBits=32 than at nBits=2048', () => {
    const big = computeRdkitMorgan(rdkit, 'CC(=O)Oc1ccccc1C(=O)O', {
      radius: 2,
      nBits: 2048,
    });
    const small = computeRdkitMorgan(rdkit, 'CC(=O)Oc1ccccc1C(=O)O', {
      radius: 2,
      nBits: 32,
    });
    // The wide fingerprint has no folding collisions here (24 distinct features);
    // the 32-bit fingerprint MUST collide, so its popcount is strictly smaller.
    expect(big.popcount).toBeGreaterThan(small.popcount);
    expect(small.length).toBe(32);
    // At least one folding collision means: distinct wide bits > narrow bits.
    expect(big.popcount - small.popcount).toBeGreaterThan(0);
  });
});
