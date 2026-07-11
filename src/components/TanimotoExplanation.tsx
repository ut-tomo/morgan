import type { MoleculeComparisonResult } from '../rdkit/types';

export function TanimotoExplanation({
  result,
  popA,
  popB,
}: {
  result: MoleculeComparisonResult;
  popA: number;
  popB: number;
}) {
  const inter = result.sharedBits.length;
  const union = popA + popB - inter;
  return (
    <section className="panel tanimoto">
      <h3>Tanimoto similarity</h3>
      <p className="tanimoto-value" aria-live="polite">
        T ={' '}
        <strong>{result.tanimoto.toFixed(4)}</strong>
      </p>
      <p className="formula">
        <code>
          T = |A ∩ B| / (|A| + |B| − |A ∩ B|) = {inter} / ({popA} + {popB} −{' '}
          {inter}) = {inter} / {union}
        </code>
      </p>
      {popA === 0 && popB === 0 ? (
        <p className="hint">
          Both fingerprints are all-zero; we define this degenerate case as
          T = 1.0 (two identical empty feature sets). Note this is a convention
          choice — RDKit's bulk Tanimoto returns 0.0 for a zero denominator. A
          valid molecule always sets at least one bit, so this case is only
          reached with empty inputs.
        </p>
      ) : null}
      <p className="warn-note">
        Fingerprint similarity compares <em>sets of local features</em>. It is
        <strong> not</strong> a graph-isomorphism test: a high Tanimoto does not
        prove the molecules are the same graph, and an identical fingerprint
        does not imply graph isomorphism.
      </p>
    </section>
  );
}
