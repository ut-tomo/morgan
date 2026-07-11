import { useState } from 'react';
import { useRdkit } from './rdkit/RdkitProvider';
import { useAnalysis } from './model/useAnalysis';
import { DEFAULT_SETTINGS, type AnalysisSettings } from './model/analyzeAll';
import { Controls } from './components/Controls';
import { SmilesInput } from './components/SmilesInput';
import { PresetSelector } from './components/PresetSelector';
import { GlossaryDrawer } from './components/GlossaryDrawer';
import { ExplorePage } from './pages/ExplorePage';
import { ComparePage } from './pages/ComparePage';
import { LimitationsPage } from './pages/LimitationsPage';
import type { MoleculePreset } from './examples/molecules';

type Tab = 'explore' | 'compare' | 'limitations';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'explore', label: 'Explore' },
  { id: 'compare', label: 'Compare' },
  { id: 'limitations', label: 'Limitations' },
];

export function App() {
  const { status, version, error: rdkitError } = useRdkit();
  const [settings, setSettings] = useState<AnalysisSettings>(DEFAULT_SETTINGS);
  const [smilesA, setSmilesA] = useState('CCO');
  const [tab, setTab] = useState<Tab>('explore');
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const a = useAnalysis(smilesA, settings);

  const selectPreset = (p: MoleculePreset) => setSmilesA(p.smiles);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title">
          <h1>Morgan Fingerprint Playground</h1>
          <p className="tagline">
            Morgan 1965 refinement · 1-WL vertex refinement · real RDKit Morgan
            fingerprints — kept honestly distinct.
          </p>
        </div>
        <div className="header-actions">
          <span
            className={`badge status-${status}`}
            role="status"
            aria-live="polite"
          >
            {status === 'ready'
              ? `RDKit ${version} ready`
              : status === 'loading'
                ? 'Loading RDKit…'
                : 'RDKit failed to load'}
          </span>
          <button type="button" onClick={() => setGlossaryOpen(true)}>
            Glossary
          </button>
        </div>
      </header>

      {status === 'error' ? (
        <div className="global-error" role="alert">
          Could not load RDKit.js: {rdkitError}. The app needs the WebAssembly
          module in <code>public/rdkit/</code>.
        </div>
      ) : null}

      <nav className="tabs" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'tab active' : 'tab'}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="toolbar">
        {tab !== 'limitations' ? (
          <SmilesInput
            id="smiles-primary"
            label={tab === 'compare' ? 'Molecule A (SMILES)' : 'SMILES'}
            value={smilesA}
            onSubmit={setSmilesA}
            error={a.error}
          />
        ) : null}
        <Controls settings={settings} onChange={setSettings} />
      </div>

      <main className="content">
        {tab === 'explore' ? (
          <div className="explore-layout">
            <aside className="sidebar">
              <PresetSelector onSelect={selectPreset} activeSmiles={smilesA} />
            </aside>
            <div className="main-col">
              {a.loading ? (
                <p className="hint">Loading RDKit…</p>
              ) : a.error ? (
                <p className="field-error" role="alert">
                  {a.error}
                </p>
              ) : a.analysis ? (
                <ExplorePage analysis={a.analysis} />
              ) : (
                <p className="hint">Enter a SMILES string to begin.</p>
              )}
            </div>
          </div>
        ) : null}

        {tab === 'compare' ? (
          <ComparePage
            settings={settings}
            smilesA={smilesA}
            onChangeA={setSmilesA}
            onApplyRadius={(radius) => setSettings((s) => ({ ...s, radius }))}
          />
        ) : null}

        {tab === 'limitations' ? <LimitationsPage /> : null}
      </main>

      <footer className="app-footer">
        <p>
          Educational tool. The RDKit panels call RDKit.js directly; the Morgan
          1965 and WL-like panels are transparent teaching implementations and
          are not claimed to be byte-for-byte identical to RDKit.
        </p>
      </footer>

      <GlossaryDrawer open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </div>
  );
}
