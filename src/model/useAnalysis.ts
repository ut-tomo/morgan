// Hook: recompute the full analysis whenever the SMILES or settings change.
// All RDKit calls happen synchronously inside analyzeEverything and clean up
// their WASM objects; only plain data is returned into React state.
import { useMemo } from 'react';
import { useRdkit } from '../rdkit/RdkitProvider';
import { analyzeEverything, type AnalysisSettings, type FullAnalysis } from './analyzeAll';

export interface AnalysisState {
  analysis: FullAnalysis | null;
  error: string | null;
  loading: boolean;
}

export function useAnalysis(
  smiles: string,
  settings: AnalysisSettings,
): AnalysisState {
  const { rdkit, status } = useRdkit();
  return useMemo<AnalysisState>(() => {
    if (status !== 'ready' || !rdkit) {
      return { analysis: null, error: null, loading: status === 'loading' };
    }
    if (!smiles.trim()) {
      return { analysis: null, error: null, loading: false };
    }
    try {
      return { analysis: analyzeEverything(rdkit, smiles, settings), error: null, loading: false };
    } catch (err) {
      return {
        analysis: null,
        error: err instanceof Error ? err.message : String(err),
        loading: false,
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rdkit, status, smiles, settings.invariantMode, settings.radius, settings.nBits, settings.showAtomIndices]);
}
