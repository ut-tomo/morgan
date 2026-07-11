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
        number of <em>distinct</em> values kept increasing, and used the
        resulting values as a partial atom ordering to{' '}
        <strong>reduce the canonicalization search</strong>. These values are{' '}
        <strong>not</strong> the final fingerprint.
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
    </section>
  );
}
