// Hooks that produce RDKit SVGs on demand, going through the adapter (never the
// raw module). Memoized so we only re-render when inputs actually change.
import { useMemo } from 'react';
import { useRdkit } from '../rdkit/RdkitProvider';
import { drawColoredByAtom, drawWithHighlights, type HighlightSpec } from '../rdkit/drawing';
import { labelColor } from '../components/palette';

export function useColoredByLabelSvg(
  smiles: string,
  labels: number[] | null,
  showAtomIndices: boolean,
): string | null {
  const { rdkit, status } = useRdkit();
  const key = labels ? labels.join(',') : '';
  return useMemo(() => {
    if (status !== 'ready' || !rdkit || !labels || !smiles.trim()) return null;
    try {
      return drawColoredByAtom(rdkit, smiles, labels.map(labelColor), {
        showAtomIndices,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rdkit, status, smiles, key, showAtomIndices]);
}

export function useHighlightSvg(
  smiles: string,
  spec: HighlightSpec | null,
): string | null {
  const { rdkit, status } = useRdkit();
  const key = spec ? `${spec.atoms.join(',')}|${spec.bonds.join(',')}` : '';
  return useMemo(() => {
    if (status !== 'ready' || !rdkit || !spec || !smiles.trim()) return null;
    try {
      return drawWithHighlights(rdkit, smiles, spec);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rdkit, status, smiles, key]);
}
