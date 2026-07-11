import type { SparseFingerprint } from '../refinement/types';
import { featureKey } from '../refinement/featureAggregation';
import { LabelChip } from './LabelChip';

export function EducationalFingerprintTable({
  sparse,
  selectedKey,
  onSelect,
}: {
  sparse: SparseFingerprint;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="table-scroll">
      <table className="data-table feature-table">
        <caption className="sr-only">
          Educational sparse fingerprint: circular environment features
        </caption>
        <thead>
          <tr>
            <th scope="col">Identifier</th>
            <th scope="col">Radius</th>
            <th scope="col">Count</th>
            <th scope="col">Center atoms</th>
          </tr>
        </thead>
        <tbody>
          {sparse.features.map((f) => {
            const key = featureKey(f.identifier, f.radius);
            const selected = key === selectedKey;
            return (
              <tr
                key={key}
                className={selected ? 'selected' : ''}
                aria-selected={selected}
              >
                <td>
                  <button
                    type="button"
                    className="feature-select"
                    onClick={() => onSelect(key)}
                    aria-label={`Inspect feature ${f.identifier} at radius ${f.radius}`}
                  >
                    <LabelChip label={f.identifier} emphasis={selected} />
                  </button>
                </td>
                <td>{f.radius}</td>
                <td>{f.count}</td>
                <td className="centers">{f.centerAtoms.join(', ')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
