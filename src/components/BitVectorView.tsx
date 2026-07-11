import { useMemo } from 'react';

/**
 * Compact grid visualization of a bit vector. Set bits are filled; the numeric
 * indices are available on hover/focus and the set-bit list is shown separately,
 * so color is not the only signal.
 */
export function BitVectorView({
  raw,
  highlightBits,
}: {
  raw: string;
  highlightBits?: Set<number>;
}) {
  const cells = useMemo(() => raw.split(''), [raw]);
  return (
    <div
      className="bitgrid"
      role="img"
      aria-label={`Bit vector of length ${raw.length} with ${
        cells.filter((c) => c === '1').length
      } bits set`}
    >
      {cells.map((c, i) => {
        const on = c === '1';
        const shared = highlightBits?.has(i);
        return (
          <span
            key={i}
            className={
              'bitcell' + (on ? ' on' : '') + (on && shared ? ' shared' : '')
            }
            title={`bit ${i}: ${on ? 'set' : 'unset'}`}
          />
        );
      })}
    </div>
  );
}
