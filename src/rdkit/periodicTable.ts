// Minimal atomic-number -> symbol table covering the elements this educational
// tool is likely to encounter. Unknown numbers fall back to "Z<n>".
const SYMBOLS: Record<number, string> = {
  1: 'H',
  5: 'B',
  6: 'C',
  7: 'N',
  8: 'O',
  9: 'F',
  14: 'Si',
  15: 'P',
  16: 'S',
  17: 'Cl',
  33: 'As',
  34: 'Se',
  35: 'Br',
  53: 'I',
};

export function elementSymbol(atomicNumber: number): string {
  return SYMBOLS[atomicNumber] ?? `Z${atomicNumber}`;
}
