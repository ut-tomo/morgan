// A colored chip that ALWAYS shows the numeric label. Color is decorative; the
// number is the accessible source of truth.
import { labelColor, textOn } from './palette';

export function LabelChip({
  label,
  title,
  emphasis = false,
}: {
  label: number;
  title?: string;
  emphasis?: boolean;
}) {
  const bg = labelColor(label);
  return (
    <span
      className="label-chip"
      title={title ?? `identifier ${label}`}
      style={{
        backgroundColor: bg,
        color: textOn(bg),
        outline: emphasis ? '2px solid #111' : 'none',
      }}
    >
      {label}
    </span>
  );
}
