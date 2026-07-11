import { Fragment } from 'react';
import type { MolecularGraph, RefinementRound } from '../refinement/types';
import { LabelChip } from './LabelChip';

function radiusExplanation(round: RefinementRound): string {
  if (round.round === 0) {
    return 'Radius 0 — each atom knows only its own transparent properties (the initial invariant). No neighbor information yet.';
  }
  return `Radius ${round.radius} — each identifier now summarizes the rooted environment reaching ${round.radius} bond${
    round.radius === 1 ? '' : 's'
  } out from the center atom.`;
}

export function RefinementTable({
  round,
  graph,
}: {
  round: RefinementRound;
  graph: MolecularGraph;
}) {
  const isInit = round.round === 0;
  return (
    <div className="refinement-table-wrap">
      <p className="radius-note">{radiusExplanation(round)}</p>
      <table className="data-table refinement-table">
        <caption className="sr-only">
          Per-atom refinement details for round {round.round}
        </caption>
        <thead>
          <tr>
            <th scope="col">Atom</th>
            <th scope="col">Knew before</th>
            <th scope="col">
              {isInit ? 'Initial invariant' : 'Neighbor signature (this round)'}
            </th>
            <th scope="col">New identifier</th>
          </tr>
        </thead>
        <tbody>
          {round.details.map((d) => {
            const atom = graph.atoms[d.atom]!;
            return (
              <tr key={d.atom}>
                <th scope="row">
                  <span className="atom-cell">
                    <span className="atom-index">{d.atom}</span>
                    <span className="atom-elem">{atom.element}</span>
                  </span>
                </th>
                <td>
                  {isInit ? (
                    <span className="muted">—</span>
                  ) : (
                    <LabelChip label={d.previousLabel} />
                  )}
                </td>
                <td className="signature-cell">
                  {isInit ? (
                    <code>{d.signatureKey}</code>
                  ) : (
                    <SignatureView
                      selfLabel={d.signature.selfLabel}
                      neighbors={d.signature.neighbors}
                    />
                  )}
                </td>
                <td>
                  <LabelChip label={d.newLabel} emphasis />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <details className="dictionary">
        <summary>
          Exact-tuple dictionary for this round ({round.dictionary.length} entries)
        </summary>
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Identifier</th>
              <th scope="col">Exact tuple / signature</th>
              <th scope="col">Atoms with this id</th>
            </tr>
          </thead>
          <tbody>
            {round.dictionary.map((e) => (
              <tr key={e.id}>
                <td>
                  <LabelChip label={e.id} />
                </td>
                <td>
                  <code>{e.key}</code>
                </td>
                <td>{e.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function SignatureView({
  selfLabel,
  neighbors,
}: {
  selfLabel: number;
  neighbors: { bondType: string; neighborLabel: number }[];
}) {
  return (
    <span className="signature">
      <span className="sig-self">
        self <LabelChip label={selfLabel} />
      </span>
      {neighbors.length === 0 ? (
        <span className="muted"> · (no neighbors)</span>
      ) : (
        <span className="sig-nbrs">
          {' · ['}
          {neighbors.map((n, i) => (
            <Fragment key={i}>
              {i > 0 ? ', ' : ''}
              <span className="bond-tag">{n.bondType}</span>→
              <LabelChip label={n.neighborLabel} />
            </Fragment>
          ))}
          {']'}
        </span>
      )}
    </span>
  );
}
