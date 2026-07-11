import type { WlRefinementResult } from '../refinement/types';

export function RefinementTimeline({
  wl,
  current,
  onChange,
}: {
  wl: WlRefinementResult;
  current: number;
  onChange: (round: number) => void;
}) {
  const last = wl.rounds.length - 1;
  return (
    <div className="timeline" role="group" aria-label="Refinement round selector">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, current - 1))}
        disabled={current === 0}
        aria-label="Previous round"
      >
        ◀
      </button>
      <div className="timeline-steps">
        {wl.rounds.map((r) => (
          <button
            key={r.round}
            type="button"
            className={r.round === current ? 'step active' : 'step'}
            aria-pressed={r.round === current}
            onClick={() => onChange(r.round)}
            title={
              r.round === 0
                ? 'Initial invariants (radius 0)'
                : `Refinement round ${r.round} — radius ${r.radius}`
            }
          >
            <span className="step-round">
              {r.round === 0 ? 'init' : `r${r.round}`}
            </span>
            <span className="step-cells">{r.distinctLabelCount} classes</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(last, current + 1))}
        disabled={current === last}
        aria-label="Next round"
      >
        ▶
      </button>
    </div>
  );
}
