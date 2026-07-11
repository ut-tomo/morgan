import { useMemo, useState } from 'react';
import {
  TRIANGULAR_PRISM,
  K33,
  compareUnderWl,
  triangleCount,
} from '../examples/graphCounterexamples';
import { GenericGraphView } from './GenericGraphView';
import { useRdkit } from '../rdkit/RdkitProvider';
import { computeRdkitMorgan } from '../rdkit/fingerprint';
import { analyzeMolecule } from '../rdkit/molecule';
import { runWlRefinement } from '../refinement/wlRefinement';
import { firstCollisionAtModulus } from '../refinement/hashCollision';

const ROUNDS = 4;

export function LimitationExplorer() {
  return (
    <div className="limitations">
      <p className="page-intro">
        Fingerprints can collide for <strong>four genuinely different
        reasons</strong>. They are not the same thing, and lumping them together
        as a vague "hash collision" hides what is really going on.
      </p>

      <ol className="limitation-list">
        <li>
          <h3>1 · Finite-radius limitation</h3>
          <p>
            A Morgan fingerprint only records environments up to the chosen
            radius. Two graphs can have <em>identical local environments up to
            that radius</em> and still differ farther out. Increasing the radius
            can separate them.
          </p>
          <p className="example-ref">
            Live example: the ortho-/para-xylene pair in the Compare tab is
            identical at radius 0 and diverges at radius 1.
          </p>
        </li>

        <li>
          <h3>2 · Refinement-expressivity limitation</h3>
          <p>
            1-WL vertex refinement (the engine behind circular fingerprints) is{' '}
            <strong>not a complete graph-isomorphism test</strong>. Some
            non-isomorphic graphs are never separated, at <em>any</em> radius.
          </p>
          <WlCounterexample />
        </li>

        <li>
          <h3>3 · Environment-identifier collision</h3>
          <p>
            A <em>practical</em> implementation hashes each structured
            environment to an integer identifier. Two genuinely different
            environments can hash to the same identifier. (Our educational
            refinement deliberately avoids this by using an exact-tuple
            dictionary — so you can see when a collision is caused by hashing
            versus by the graph itself.)
          </p>
          <HashCollisionDemo />
        </li>

        <li>
          <h3>4 · Bit-folding collision</h3>
          <p>
            Even with distinct identifiers, the final step folds them into a
            fixed-length bit vector by taking the identifier modulo the length.
            Distinct identifiers can land on the <em>same bit</em>. Shrink the
            fingerprint length and watch the population count drop below the
            number of distinct features.
          </p>
          <BitFoldingDemo />
        </li>
      </ol>
    </div>
  );
}

function WlCounterexample() {
  const [round, setRound] = useState(ROUNDS);
  const data = useMemo(() => compareUnderWl(TRIANGULAR_PRISM, K33, ROUNDS), []);
  const a = data.a[round]!;
  const b = data.b[round]!;
  return (
    <div className="wl-demo">
      <p className="demo-caption">
        The triangular prism and K(3,3) are both 3-regular on 6 vertices. With
        uniform initial labels, 1-WL gives every vertex the same color at every
        round, so their color histograms are{' '}
        <strong>{data.histogramsMatch ? 'always equal' : 'different'}</strong> —
        1-WL cannot distinguish them. Yet they are not isomorphic: the prism has{' '}
        {triangleCount(TRIANGULAR_PRISM)} triangles, K(3,3) has{' '}
        {triangleCount(K33)}.
      </p>
      <div className="round-picker" role="group" aria-label="WL round">
        <span>Round:</span>
        {data.a.map((r) => (
          <button
            key={r.round}
            type="button"
            className={r.round === round ? 'seg active' : 'seg'}
            aria-pressed={r.round === round}
            onClick={() => setRound(r.round)}
          >
            {r.round}
          </button>
        ))}
      </div>
      <div className="wl-graphs">
        <figure>
          <GenericGraphView graph={TRIANGULAR_PRISM} colors={a.colors} />
          <figcaption>
            {TRIANGULAR_PRISM.name} — colors:{' '}
            {a.histogram.map((h) => `${h.count}×[${h.color}]`).join(' ')}
          </figcaption>
        </figure>
        <figure>
          <GenericGraphView graph={K33} colors={b.colors} />
          <figcaption>
            {K33.name} — colors:{' '}
            {b.histogram.map((h) => `${h.count}×[${h.color}]`).join(' ')}
          </figcaption>
        </figure>
      </div>
      <p className="hint">
        Graph-theory example, not a claim about ordinary stable molecules.{' '}
        1-WL distinguishing two graphs proves they are non-isomorphic; 1-WL
        failing to distinguish them proves nothing.
      </p>
    </div>
  );
}

const FOLD_SMILES = 'CC(=O)Oc1ccccc1C(=O)O';
const FOLD_LENGTHS = [2048, 256, 64, 32];

function BitFoldingDemo() {
  const { rdkit, status } = useRdkit();
  const rows = useMemo(() => {
    if (status !== 'ready' || !rdkit) return null;
    return FOLD_LENGTHS.map((n) => ({
      nBits: n,
      popcount: computeRdkitMorgan(rdkit, FOLD_SMILES, { radius: 2, nBits: n })
        .popcount,
    }));
  }, [rdkit, status]);

  if (!rows) return <p className="hint">Loading RDKit…</p>;
  const wide = rows[0]!.popcount;

  return (
    <div className="fold-demo">
      <p className="demo-caption">
        Aspirin (<code>{FOLD_SMILES}</code>), radius 2, computed live by RDKit.
        The wide fingerprint separates all {wide} features; narrower ones fold
        distinct features onto shared bits.
      </p>
      <table className="data-table">
        <caption className="sr-only">Population count vs fingerprint length</caption>
        <thead>
          <tr>
            <th scope="col">Length (nBits)</th>
            <th scope="col">Set bits</th>
            <th scope="col">Folding collisions (vs widest)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.nBits}>
              <th scope="row">{r.nBits}</th>
              <td>{r.popcount}</td>
              <td>{wide - r.popcount > 0 ? `≥ ${wide - r.popcount}` : '0'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">
        A smaller set-bit count at the same radius proves distinct environment
        identifiers collided when folded — verified here against the live RDKit
        output, not asserted.
      </p>
    </div>
  );
}

// Illustrative hashing collision (mechanism 3), computed live on real
// environment signatures with a small toy hash.
const HASH_SMILES = 'CC(=O)Oc1ccccc1C(=O)O';
const HASH_MODULI = [8, 12, 16, 24, 32, 48, 64];

function HashCollisionDemo() {
  const { rdkit, status } = useRdkit();
  const result = useMemo(() => {
    if (status !== 'ready' || !rdkit) return null;
    const graph = analyzeMolecule(rdkit, HASH_SMILES).graph;
    const wl = runWlRefinement(graph, 'rdkit-inspired', 2);
    // Distinct educational signatures across all radii.
    const sigs = new Set<string>();
    for (const round of wl.rounds) for (const e of round.dictionary) sigs.add(e.key);
    const signatures = [...sigs];
    const collision = firstCollisionAtModulus(signatures, HASH_MODULI);
    return { distinct: signatures.length, collision };
  }, [rdkit, status]);

  if (!result) return <p className="hint">Loading RDKit…</p>;
  const { distinct, collision } = result;
  return (
    <div className="hash-demo">
      <p className="demo-caption">
        Aspirin has {distinct} distinct educational environment signatures. A
        real implementation would hash each to an integer. Using a small toy
        hash <code>FNV-1a(signature) mod M</code> (illustrative, not RDKit's
        hash):
      </p>
      {collision ? (
        <table className="data-table">
          <caption className="sr-only">Two distinct signatures hashing to the same bucket</caption>
          <thead>
            <tr>
              <th scope="col">Distinct signature</th>
              <th scope="col">FNV-1a hash</th>
              <th scope="col">mod {collision.modulus}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="sig-cell"><code>{collision.a}</code></td>
              <td>{collision.fullHashA}</td>
              <td className="distinct">{collision.bucket}</td>
            </tr>
            <tr>
              <td className="sig-cell"><code>{collision.b}</code></td>
              <td>{collision.fullHashB}</td>
              <td className="distinct">{collision.bucket}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="hint">No collision at the tested moduli for this molecule.</p>
      )}
      <p className="hint">
        Two <strong>different</strong> environments landed on identifier{' '}
        {collision?.bucket} — an identifier collision that happened{' '}
        <em>before</em> any bit-folding. This is why the educational mode uses an
        exact dictionary instead: it lets you attribute a collision to hashing
        (this section) rather than to the graph (section 1 and 2).
      </p>
    </div>
  );
}
