import type { AnalysisSettings } from '../model/analyzeAll';
import { INITIAL_INVARIANT_MODES } from '../refinement/atomInvariants';
import type { InitialInvariantMode } from '../refinement/types';

const RADII = [0, 1, 2, 3];
const NBITS = [32, 64, 256, 512, 1024, 2048];

export function Controls({
  settings,
  onChange,
}: {
  settings: AnalysisSettings;
  onChange: (next: AnalysisSettings) => void;
}) {
  const set = <K extends keyof AnalysisSettings>(key: K, value: AnalysisSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className="controls" role="group" aria-label="Analysis controls">
      <fieldset>
        <legend>Radius</legend>
        <div className="segmented">
          {RADII.map((r) => (
            <button
              key={r}
              type="button"
              className={settings.radius === r ? 'seg active' : 'seg'}
              aria-pressed={settings.radius === r}
              onClick={() => set('radius', r)}
            >
              {r}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Fingerprint length (nBits)</legend>
        <select
          value={settings.nBits}
          onChange={(e) => set('nBits', Number(e.target.value))}
          aria-label="Fingerprint length in bits"
        >
          {NBITS.map((n) => (
            <option key={n} value={n}>
              {n}
              {n <= 64 ? ' (collision demo)' : n === 2048 ? ' (default)' : ''}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset>
        <legend>Educational initial invariant</legend>
        <select
          value={settings.invariantMode}
          onChange={(e) => set('invariantMode', e.target.value as InitialInvariantMode)}
          aria-label="Initial atom invariant mode"
        >
          {INITIAL_INVARIANT_MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="hint">
          {INITIAL_INVARIANT_MODES.find((m) => m.value === settings.invariantMode)?.description}
        </p>
      </fieldset>

      <fieldset>
        <legend>Drawing</legend>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.showAtomIndices}
            onChange={(e) => set('showAtomIndices', e.target.checked)}
          />
          Show atom indices
        </label>
      </fieldset>
    </div>
  );
}
