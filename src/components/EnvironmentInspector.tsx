import { useMemo } from 'react';
import type {
  EnvironmentFeature,
  MolecularGraph,
  WlRefinementResult,
} from '../refinement/types';
import { environmentBall } from '../refinement/graph';
import { useHighlightSvg } from '../model/useSvg';
import { MoleculeViewer } from './MoleculeViewer';
import { LabelChip } from './LabelChip';

export function EnvironmentInspector({
  feature,
  wl,
  graph,
  smiles,
}: {
  feature: EnvironmentFeature | null;
  wl: WlRefinementResult;
  graph: MolecularGraph;
  smiles: string;
}) {
  const highlight = useMemo(() => {
    if (!feature) return null;
    const atoms = new Set<number>();
    const bonds = new Set<number>();
    for (const center of feature.centerAtoms) {
      const ball = environmentBall(graph, center, feature.radius);
      ball.atoms.forEach((a) => atoms.add(a));
      ball.bonds.forEach((b) => bonds.add(b));
    }
    return {
      atoms: [...atoms],
      bonds: [...bonds],
      showAtomIndices: true,
      color: [1.0, 0.72, 0.2] as [number, number, number],
    };
  }, [feature, graph]);

  const svg = useHighlightSvg(smiles, highlight);

  if (!feature) {
    return (
      <div className="inspector empty">
        <p>Select a feature to highlight its circular environment.</p>
      </div>
    );
  }

  const dictEntry = wl.rounds[feature.radius]?.dictionary.find(
    (e) => e.id === feature.identifier,
  );

  return (
    <div className="inspector">
      <h4>
        Environment <LabelChip label={feature.identifier} emphasis /> at radius{' '}
        {feature.radius}
      </h4>
      {svg ? (
        <MoleculeViewer
          svg={svg}
          description={`Molecule with the radius-${feature.radius} environment of identifier ${feature.identifier} highlighted, centered on atoms ${feature.centerAtoms.join(', ')}.`}
          caption={`Highlighted: the atoms and bonds within radius ${feature.radius} of each center atom.`}
        />
      ) : null}
      <dl className="inspector-meta">
        <div>
          <dt>Occurrence count</dt>
          <dd>{feature.count}</dd>
        </div>
        <div>
          <dt>Center atoms</dt>
          <dd>{feature.centerAtoms.join(', ')}</dd>
        </div>
        <div>
          <dt>Exact educational signature</dt>
          <dd>
            <code>{dictEntry?.key ?? '(radius 0 invariant)'}</code>
          </dd>
        </div>
      </dl>
      <p className="hint">
        This is the fully transparent educational provenance for this circular,
        atom-centered environment — not RDKit's internal bit provenance.
      </p>
    </div>
  );
}
