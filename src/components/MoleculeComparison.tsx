import { useMemo } from 'react';
import type { FullAnalysis } from '../model/analyzeAll';
import type { MoleculeComparisonResult } from '../rdkit/types';
import { MoleculeViewer } from './MoleculeViewer';
import { RdkitFingerprintPanel } from './RdkitFingerprintPanel';
import { TanimotoExplanation } from './TanimotoExplanation';

export function MoleculeComparison({
  a,
  b,
  result,
}: {
  a: FullAnalysis;
  b: FullAnalysis;
  result: MoleculeComparisonResult;
}) {
  const sharedSet = useMemo(() => new Set(result.sharedBits), [result.sharedBits]);
  return (
    <div className="comparison">
      <div className="comparison-mols">
        <ComparisonSide label="Molecule A" analysis={a} sharedSet={sharedSet} />
        <ComparisonSide label="Molecule B" analysis={b} sharedSet={sharedSet} />
      </div>

      <TanimotoExplanation
        result={result}
        popA={a.rdkitFp.popcount}
        popB={b.rdkitFp.popcount}
      />

      <section className="panel bit-breakdown">
        <h3>Bit-level breakdown (RDKit fingerprints)</h3>
        <p className="hint">
          Comparison uses radius {a.settings.radius} and {a.rdkitFp.length}-bit
          vectors. Shared bits are outlined in the compact vectors above.
        </p>
        <div className="bit-columns">
          <BitList title="Shared bits" bits={result.sharedBits} />
          <BitList title="Only in A" bits={result.uniqueToA} />
          <BitList title="Only in B" bits={result.uniqueToB} />
        </div>
      </section>

      <section className="panel env-overlap">
        <h3>Pedagogical environment overlap</h3>
        <p className="hint">
          From the transparent educational refinement (not RDKit bits). Two
          molecules share an environment when the same (identifier, radius)
          feature appears in both.
        </p>
        <dl className="stat-row">
          <div>
            <dt>Shared environments</dt>
            <dd>{result.sharedEnvironmentCount}</dd>
          </div>
          <div>
            <dt>Only in A</dt>
            <dd>{result.environmentsOnlyInA}</dd>
          </div>
          <div>
            <dt>Only in B</dt>
            <dd>{result.environmentsOnlyInB}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function ComparisonSide({
  label,
  analysis,
  sharedSet,
}: {
  label: string;
  analysis: FullAnalysis;
  sharedSet: Set<number>;
}) {
  return (
    <div className="comparison-side">
      <h3>
        {label}: <code>{analysis.molecule.canonicalSmiles}</code>
      </h3>
      <MoleculeViewer
        svg={analysis.molecule.svg}
        description={`Structure of ${analysis.molecule.canonicalSmiles}`}
      />
      <RdkitFingerprintPanel
        fp={analysis.rdkitFp}
        rdkitVersion={analysis.molecule.rdkitVersion}
        sharedBits={sharedSet}
      />
    </div>
  );
}

function BitList({ title, bits }: { title: string; bits: number[] }) {
  return (
    <div className="bit-list">
      <h4>
        {title} <span className="count">({bits.length})</span>
      </h4>
      <p className="setbits">{bits.length ? bits.join(', ') : '—'}</p>
    </div>
  );
}
