import { PRESET_GROUPS, type MoleculePreset } from '../examples/molecules';

export function PresetSelector({
  onSelect,
  activeSmiles,
}: {
  onSelect: (preset: MoleculePreset) => void;
  activeSmiles?: string;
}) {
  return (
    <div className="preset-selector">
      <h3>Presets</h3>
      {PRESET_GROUPS.map((group) => (
        <div key={group.title} className="preset-group">
          <h4>{group.title}</h4>
          <div className="preset-buttons">
            {group.presets.map((p) => (
              <button
                key={p.id}
                type="button"
                className={activeSmiles === p.smiles ? 'preset active' : 'preset'}
                onClick={() => onSelect(p)}
                title={p.note ?? p.smiles}
                aria-pressed={activeSmiles === p.smiles}
              >
                <span className="preset-name">{p.name}</span>
                <span className="preset-smiles">{p.smiles}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
