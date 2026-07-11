import { useEffect, useMemo, useState } from 'react';
import type { FullAnalysis } from '../model/analyzeAll';
import { MoleculeViewer } from '../components/MoleculeViewer';
import { RefinementTimeline } from '../components/RefinementTimeline';
import { RefinementTable } from '../components/RefinementTable';
import { Morgan1965Panel } from '../components/Morgan1965Panel';
import { EducationalFingerprintTable } from '../components/EducationalFingerprintTable';
import { EnvironmentInspector } from '../components/EnvironmentInspector';
import { RdkitFingerprintPanel } from '../components/RdkitFingerprintPanel';
import { useColoredByLabelSvg } from '../model/useSvg';
import { featureKey } from '../refinement/featureAggregation';

type RefinementMode = 'wl' | 'morgan1965';

export function ExplorePage({ analysis }: { analysis: FullAnalysis }) {
  const { molecule, wl, morgan1965, sparse, rdkitFp } = analysis;
  const [round, setRound] = useState(0);
  const [mode, setMode] = useState<RefinementMode>('wl');
  const [selectedFeatureKey, setSelectedFeatureKey] = useState<string | null>(null);

  // Reset transient selections when the molecule or radius changes.
  useEffect(() => {
    setRound(Math.min(round, wl.rounds.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wl.rounds.length]);
  useEffect(() => {
    setSelectedFeatureKey(null);
  }, [molecule.inputSmiles, analysis.settings.radius, analysis.settings.invariantMode]);

  const currentRound = wl.rounds[Math.min(round, wl.rounds.length - 1)]!;
  const coloredLabels = currentRound.details.map((d) => d.newLabel);
  const coloredSvg = useColoredByLabelSvg(
    molecule.inputSmiles,
    coloredLabels,
    analysis.settings.showAtomIndices,
  );

  const selectedFeature = useMemo(
    () =>
      sparse.features.find(
        (f) => featureKey(f.identifier, f.radius) === selectedFeatureKey,
      ) ?? null,
    [sparse.features, selectedFeatureKey],
  );

  return (
    <div className="explore-page">
      <section className="panel identity">
        <div className="identity-grid">
          <MoleculeViewer
            svg={molecule.svg}
            description={`2D structure of ${molecule.canonicalSmiles}`}
            caption="Rendered by RDKit.js"
          />
          <dl className="identity-meta">
            <div>
              <dt>Input SMILES</dt>
              <dd>
                <code>{molecule.inputSmiles}</code>
              </dd>
            </div>
            <div>
              <dt>RDKit canonical SMILES</dt>
              <dd>
                <code>{molecule.canonicalSmiles}</code>
              </dd>
            </div>
            <div>
              <dt>Heavy atoms / bonds</dt>
              <dd>
                {molecule.graph.atoms.length} / {molecule.graph.bonds.length}
              </dd>
            </div>
            <div>
              <dt>RDKit version</dt>
              <dd>{molecule.rdkitVersion}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="panel refinement">
        <div className="panel-header">
          <h2>Node refinement</h2>
          <div className="segmented" role="group" aria-label="Refinement mode">
            <button
              type="button"
              className={mode === 'wl' ? 'seg active' : 'seg'}
              aria-pressed={mode === 'wl'}
              onClick={() => setMode('wl')}
            >
              WL-like (educational)
            </button>
            <button
              type="button"
              className={mode === 'morgan1965' ? 'seg active' : 'seg'}
              aria-pressed={mode === 'morgan1965'}
              onClick={() => setMode('morgan1965')}
            >
              Morgan 1965
            </button>
          </div>
        </div>

        {mode === 'wl' ? (
          <>
            <p className="panel-intro">
              Each round rebuilds every atom's identifier from a{' '}
              <strong>structured signature</strong>: its current label plus the
              sorted multiset of (bond type, neighbor label) pairs. Integer ids
              come from an exact-tuple dictionary — no lossy hash. After round r,
              an identifier summarizes the rooted environment out to radius r.
              This is <em>not</em> guaranteed byte-for-byte identical to RDKit.
            </p>
            <div className="refinement-body">
              <div className="refinement-molecule">
                {coloredSvg ? (
                  <MoleculeViewer
                    svg={coloredSvg}
                    description={`Molecule with atoms colored by their round-${currentRound.round} identifier`}
                    caption={`Atoms colored by round-${currentRound.round} identifier (numbers on chips are the identifiers).`}
                  />
                ) : (
                  <MoleculeViewer
                    svg={molecule.svg}
                    description="Molecule structure"
                  />
                )}
              </div>
              <div className="refinement-controls">
                <RefinementTimeline wl={wl} current={round} onChange={setRound} />
              </div>
            </div>
            <RefinementTable round={currentRound} graph={molecule.graph} />
          </>
        ) : (
          <Morgan1965Panel result={morgan1965} graph={molecule.graph} />
        )}
      </section>

      <section className="panel educational-fp">
        <h2>Educational sparse fingerprint (circular environments)</h2>
        <p className="panel-intro">
          The multiset of circular, atom-centered environment features collected
          from the educational refinement, over radii 0–{sparse.maxRadius}. Click
          a feature to highlight the atoms and bonds inside its radius. This is a
          transparent teaching model — <strong>not</strong> the RDKit output.
        </p>
        <div className="fp-body">
          <EducationalFingerprintTable
            sparse={sparse}
            selectedKey={selectedFeatureKey}
            onSelect={setSelectedFeatureKey}
          />
          <EnvironmentInspector
            feature={selectedFeature}
            wl={wl}
            graph={molecule.graph}
            smiles={molecule.inputSmiles}
          />
        </div>
      </section>

      <RdkitFingerprintPanel
        fp={rdkitFp}
        rdkitVersion={molecule.rdkitVersion}
      />
    </div>
  );
}
