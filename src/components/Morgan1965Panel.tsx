import type { MolecularGraph, Morgan1965Result } from '../refinement/types';

export function Morgan1965Panel({
  result,
  graph,
}: {
  result: Morgan1965Result;
  graph: MolecularGraph;
}) {
  return (
    <section className="panel morgan1965">
      <h3>Morgan 1965 connectivity refinement</h3>
      <p className="panel-intro">
        Morgan's original 1965 procedure seeds each atom with its heavy-atom
        degree, then repeatedly replaces every value with the{' '}
        <strong>sum of its neighbors' values</strong>. He iterated while the
        number k of <em>distinct</em> values kept increasing; when a round did
        not increase k (k′ ≤ k), the process stopped and the <em>previous</em>{' '}
        round's values were used as a partial atom ordering to{' '}
        <strong>reduce the canonicalization search</strong>. These values are{' '}
        <strong>not</strong> the final fingerprint.
      </p>
      <p className="warn-note">
        Note: these connectivity values describe <strong>graph connectivity
        only</strong> — they ignore the element. That is why, for example, the
        terminal CH<sub>3</sub> and the terminal OH of 1-propanol receive the
        same value: element identity enters later, in a separate part of the
        connection table.
      </p>
      <div className="table-scroll">
        <table className="data-table morgan-grid">
          <caption className="sr-only">Morgan 1965 connectivity values per round</caption>
          <thead>
            <tr>
              <th scope="col">Round</th>
              {graph.atoms.map((a) => (
                <th scope="col" key={a.index}>
                  {a.index}
                  <span className="th-sub">{a.element}</span>
                </th>
              ))}
              <th scope="col">#distinct</th>
            </tr>
          </thead>
          <tbody>
            {result.rounds.map((round) => (
              <tr
                key={round.round}
                className={round.round === result.stabilizedAtRound ? 'stabilized' : ''}
              >
                <th scope="row">
                  {round.round === 0 ? 'init (degree)' : `sum #${round.round}`}
                </th>
                {round.values.map((v, i) => (
                  <td key={i}>{v}</td>
                ))}
                <td className="distinct">{round.distinctValueCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">
        Highlighted row: the count of distinct values stopped increasing here —
        the stable partition Morgan would have used (round{' '}
        {result.stabilizedAtRound}).
      </p>

      <details className="canon-backend">
        <summary>What happens after refinement — the rest of Morgan 1965</summary>
        <p>
          The connectivity values above are only the <em>first</em> step. This
          tool implements that refinement; the full 1965 canonicalization
          continues (and is described here, not computed):
        </p>
        <ol className="canon-steps">
          <li>
            The connectivity values induce a <strong>partial ordering</strong>
            of the atoms (higher value listed earlier).
          </li>
          <li>
            That ordering plus the numbering rules <strong>constrain the
            candidate atom numberings</strong> to a small invariant subset
            (Morgan reports, e.g., 14,592 → 8 candidates for one example).
          </li>
          <li>
            Each remaining candidate is turned into a{' '}
            <strong>connection table</strong> (the FROM-attachment, ring-closure,
            node-value, and line-value lists).
          </li>
          <li>
            The candidate tables are compared{' '}
            <strong>lexicographically</strong>; the one that sorts first is the
            unique canonical description, plus a look-ahead to break ties among
            terminal atoms.
          </li>
        </ol>
        <p className="hint">
          So the output of Morgan 1965 is a <strong>canonical connection
          table</strong> (a unique machine description), not a fingerprint and
          not the connectivity values themselves.
        </p>
      </details>
    </section>
  );
}
