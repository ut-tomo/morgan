import { describe, it, expect, beforeAll } from 'vitest';
import type { RDKitModule } from '../rdkit/types';
import { getTestRDKit } from './rdkitTestHelper';
import { analyzeEverything, compareAnalyses, DEFAULT_SETTINGS } from '../model/analyzeAll';

let rdkit: RDKitModule;
beforeAll(async () => {
  rdkit = await getTestRDKit();
});

describe('cross-molecule educational environment overlap', () => {
  it('same molecule from two SMILES traversals => 100% shared, 0 unique', () => {
    const s = { ...DEFAULT_SETTINGS, radius: 1 };
    // ortho-xylene written two different ways.
    const a = analyzeEverything(rdkit, 'Cc1ccccc1C', s);
    const b = analyzeEverything(rdkit, 'c1ccc(C)c(C)c1', s);
    const cmp = compareAnalyses(a, b);
    expect(cmp.tanimoto).toBe(1);
    expect(cmp.environmentsOnlyInA).toBe(0);
    expect(cmp.environmentsOnlyInB).toBe(0);
    expect(cmp.sharedEnvironmentCount).toBeGreaterThan(0);
  });

  it('genuinely different isomers give a SYMMETRIC difference (both sides have unique environments)', () => {
    // o-xylene vs p-xylene at radius 1: they truly differ, and by symmetry each
    // must own environments the other lacks. The old id-based comparison gave a
    // spurious one-sided result (onlyB === 0); the shared-dictionary comparison
    // must be symmetric.
    const s = { ...DEFAULT_SETTINGS, radius: 1 };
    const o = analyzeEverything(rdkit, 'Cc1ccccc1C', s);
    const p = analyzeEverything(rdkit, 'Cc1ccc(C)cc1', s);
    const cmp = compareAnalyses(o, p);
    expect(cmp.environmentsOnlyInA).toBeGreaterThan(0);
    expect(cmp.environmentsOnlyInB).toBeGreaterThan(0);
  });

  it('identical structures at radius 0 share every environment', () => {
    const s = { ...DEFAULT_SETTINGS, radius: 0 };
    const o = analyzeEverything(rdkit, 'Cc1ccccc1C', s);
    const p = analyzeEverything(rdkit, 'Cc1ccc(C)cc1', s);
    const cmp = compareAnalyses(o, p);
    // o-/p-xylene are indistinguishable at radius 0.
    expect(cmp.environmentsOnlyInA).toBe(0);
    expect(cmp.environmentsOnlyInB).toBe(0);
  });

  it('a shared environment really corresponds to the same structure (benzene ⊂ pyridine ring CH)', () => {
    const s = { ...DEFAULT_SETTINGS, radius: 1 };
    const benzene = analyzeEverything(rdkit, 'c1ccccc1', s);
    const pyridine = analyzeEverything(rdkit, 'n1ccccc1', s);
    const cmp = compareAnalyses(benzene, pyridine);
    // They share aromatic-CH environments but each keeps unique ones.
    expect(cmp.sharedEnvironmentCount).toBeGreaterThan(0);
    expect(cmp.environmentsOnlyInB).toBeGreaterThan(0); // pyridine has N environments
  });
});
