// React context that owns the single RDKit.js module instance. UI components
// consume it via useRdkit(); they never import the raw global module.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadRDKit } from './loader';
import type { RDKitModule } from './types';

interface RdkitState {
  status: 'loading' | 'ready' | 'error';
  rdkit: RDKitModule | null;
  version: string | null;
  error: string | null;
}

const RdkitContext = createContext<RdkitState>({
  status: 'loading',
  rdkit: null,
  version: null,
  error: null,
});

export function RdkitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RdkitState>({
    status: 'loading',
    rdkit: null,
    version: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    loadRDKit()
      .then((rdkit) => {
        if (cancelled) return;
        setState({
          status: 'ready',
          rdkit,
          version: rdkit.version(),
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          rdkit: null,
          version: null,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <RdkitContext.Provider value={value}>{children}</RdkitContext.Provider>;
}

export function useRdkit(): RdkitState {
  return useContext(RdkitContext);
}
