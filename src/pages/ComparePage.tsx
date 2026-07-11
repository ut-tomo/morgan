import { useMemo, useState } from 'react';
import type { AnalysisSettings } from '../model/analyzeAll';
import { compareAnalyses } from '../model/analyzeAll';
import { useAnalysis } from '../model/useAnalysis';
import { SmilesInput } from '../components/SmilesInput';
import { MoleculeComparison } from '../components/MoleculeComparison';
import { COMPARISON_PRESETS } from '../examples/molecules';

export function ComparePage({
  settings,
  smilesA,
  onChangeA,
  onApplyRadius,
}: {
  settings: AnalysisSettings;
  smilesA: string;
  onChangeA: (smiles: string) => void;
  onApplyRadius: (radius: number) => void;
}) {
  const [smilesB, setSmilesB] = useState('OCC');

  const a = useAnalysis(smilesA, settings);
  const b = useAnalysis(smilesB, settings);

  const result = useMemo(() => {
    if (!a.analysis || !b.analysis) return null;
    return compareAnalyses(a.analysis, b.analysis);
  }, [a.analysis, b.analysis]);

  return (
    <div className="compare-page">
      <section className="panel">
        <h2>Compare two molecules</h2>
        <div className="compare-inputs">
          <SmilesInput
            id="smiles-a"
            label="Molecule A (SMILES)"
            value={smilesA}
            onSubmit={onChangeA}
            error={a.error}
          />
          <SmilesInput
            id="smiles-b"
            label="Molecule B (SMILES)"
            value={smilesB}
            onSubmit={setSmilesB}
            error={b.error}
          />
        </div>

        <div className="comparison-presets">
          <h3>Comparison presets</h3>
          <div className="preset-buttons">
            {COMPARISON_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="preset"
                onClick={() => {
                  onChangeA(p.a.smiles);
                  setSmilesB(p.b.smiles);
                  if (p.suggestedRadius !== undefined) onApplyRadius(p.suggestedRadius);
                }}
                title={p.lookFor}
              >
                <span className="preset-name">{p.name}</span>
                <span className="preset-smiles">
                  {p.a.smiles} vs {p.b.smiles}
                </span>
              </button>
            ))}
          </div>
          <p className="hint">
            Comparisons use the current radius ({settings.radius}) and nBits
            ({settings.nBits}). Change them in the controls above to see how the
            comparison responds.
          </p>
        </div>
      </section>

      {a.analysis && b.analysis && result ? (
        <MoleculeComparison a={a.analysis} b={b.analysis} result={result} />
      ) : (
        <p className="hint">Enter two valid molecules to compare.</p>
      )}
    </div>
  );
}
