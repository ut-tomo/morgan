import type { BitFingerprint } from '../rdkit/types';
import { rdkitParamsJson } from '../rdkit/fingerprint';
import { BitVectorView } from './BitVectorView';

export function RdkitFingerprintPanel({
  fp,
  rdkitVersion,
  sharedBits,
}: {
  fp: BitFingerprint;
  rdkitVersion: string;
  sharedBits?: Set<number>;
}) {
  const json = JSON.stringify(
    { params: fp.params, length: fp.length, setBits: fp.setBits },
    null,
    2,
  );
  return (
    <section className="panel rdkit-panel">
      <div className="panel-header">
        <h3>RDKit Morgan fingerprint</h3>
        <span className="badge rdkit-badge">RDKit {rdkitVersion} output</span>
      </div>
      <p className="panel-intro">
        This vector is produced by calling <code>get_morgan_fp</code> on
        RDKit.js directly. We display exactly what RDKit returned.
      </p>

      <div className="param-line">
        <span>Parameters passed to RDKit:</span>
        <code>{rdkitParamsJson(fp.params)}</code>
      </div>

      <dl className="stat-row">
        <div>
          <dt>Bit-vector length</dt>
          <dd>{fp.length}</dd>
        </div>
        <div>
          <dt>Set bits (population count)</dt>
          <dd>{fp.popcount}</dd>
        </div>
      </dl>

      <h4>Compact bit vector</h4>
      <BitVectorView raw={fp.raw} highlightBits={sharedBits} />

      <h4>Set-bit indices (sorted)</h4>
      <p className="setbits">
        {fp.setBits.length ? fp.setBits.join(', ') : '(no bits set)'}
      </p>

      <p className="provenance-note">
        RDKit produced these bits, but this browser API does not expose RDKit's
        complete atom/radius provenance for each bit. The transparent
        provenance shown elsewhere on this page comes from the separate{' '}
        <em>educational</em> refinement, which is labeled as such and is not
        guaranteed to be byte-for-byte identical to RDKit.
      </p>

      <details className="raw-panel">
        <summary>Raw output &amp; JSON export</summary>
        <h5>Raw bit string</h5>
        <textarea className="raw-bits" readOnly rows={4} value={fp.raw} />
        <h5>JSON export</h5>
        <textarea className="raw-json" readOnly rows={8} value={json} />
      </details>
    </section>
  );
}
