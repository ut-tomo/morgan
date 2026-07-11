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
  const samemolecule =
    a.molecule.canonicalSmiles === b.molecule.canonicalSmiles &&
    a.molecule.inputSmiles !== b.molecule.inputSmiles;
  return (
    <div className="comparison">
      {samemolecule ? (
        <div className="perm-callout" role="note">
          <strong>Permutation invariance:</strong> A (
          <code>{a.molecule.inputSmiles}</code>) and B (
          <code>{b.molecule.inputSmiles}</code>) are the <em>same</em> molecule
          written by different SMILES traversals. Compare the atom-index labels
          in the two drawings — the numbering differs — yet RDKit canonicalizes
          both to <code>{a.molecule.canonicalSmiles}</code> and the fingerprints
          are identical (Tanimoto = 1.0). The fingerprint depends on the graph,
          not on how the atoms happened to be numbered.
        </div>
      ) : null}
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
          From the transparent educational refinement (not RDKit bits). To make
          the two molecules comparable, both graphs are refined against a{' '}
          <strong>single shared identifier dictionary</strong>, so the same
          rooted environment gets the same identifier in each molecule. Two
          molecules share an environment when the identical (structure, radius)
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
