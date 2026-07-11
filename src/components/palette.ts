// Accessible label coloring. Colors are ALWAYS accompanied by the numeric label
// in the UI, so color is never the sole channel of information.

// A qualitative palette chosen for reasonable contrast; it cycles for large
// label counts (the numeric id remains the ground truth).
const PALETTE = [
  '#4e79a7',
  '#f28e2b',
  '#59a14f',
  '#e15759',
  '#b07aa1',
  '#76b7b2',
  '#edc948',
  '#ff9da7',
  '#9c755f',
  '#bab0ac',
  '#86bcb6',
  '#d37295',
];

export function labelColor(label: number): string {
  const idx = ((label % PALETTE.length) + PALETTE.length) % PALETTE.length;
  return PALETTE[idx]!;
}

/** Pick a readable text color (black/white) for a given background hex. */
export function textOn(bgHex: string): string {
  const hex = bgHex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111' : '#fff';
}
