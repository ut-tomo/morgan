// Adapter: RDKit SVG drawing, including atom/bond highlighting where the API
// supports it. Highlight colors are passed through RDKit's own drawer.

import type { RDKitModule } from './types';
import { InvalidSmilesError } from './molecule';

export interface HighlightSpec {
  atoms: number[];
  bonds: number[];
  /** RGB triple in 0..1, RDKit's expected format. */
  color?: [number, number, number];
  showAtomIndices?: boolean;
  width?: number;
  height?: number;
}

/**
 * Render a molecule with a highlighted circular environment.
 * RDKit draws the highlight; we only choose which atoms/bonds to pass.
 */
export function drawWithHighlights(
  rdkit: RDKitModule,
  smiles: string,
  spec: HighlightSpec,
): string {
  const mol = rdkit.get_mol(smiles.trim());
  if (!mol) throw new InvalidSmilesError(smiles);
  try {
    if (!mol.is_valid()) throw new InvalidSmilesError(smiles);
    const color = spec.color ?? [1.0, 0.7, 0.2];
    const atomColors: Record<number, [number, number, number]> = {};
    const bondColors: Record<number, [number, number, number]> = {};
    for (const a of spec.atoms) atomColors[a] = color;
    for (const b of spec.bonds) bondColors[b] = color;
    const details = {
      width: spec.width ?? 420,
      height: spec.height ?? 320,
      addAtomIndices: spec.showAtomIndices ?? true,
      atoms: spec.atoms,
      bonds: spec.bonds,
      highlightAtomColors: atomColors,
      highlightBondColors: bondColors,
      legend: '',
    };
    return mol.get_svg_with_highlights(JSON.stringify(details));
  } finally {
    mol.delete();
  }
}

function hexToRgbTriple(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

/**
 * Draw a molecule with each atom tinted by an arbitrary per-atom hex color
 * (used to color atoms by their current refinement identifier). RDKit renders
 * the highlight; we only choose the colors.
 */
export function drawColoredByAtom(
  rdkit: RDKitModule,
  smiles: string,
  colorByAtom: string[],
  options: { showAtomIndices?: boolean; width?: number; height?: number } = {},
): string {
  const mol = rdkit.get_mol(smiles.trim());
  if (!mol) throw new InvalidSmilesError(smiles);
  try {
    if (!mol.is_valid()) throw new InvalidSmilesError(smiles);
    const atoms: number[] = [];
    const atomColors: Record<number, [number, number, number]> = {};
    colorByAtom.forEach((hex, index) => {
      atoms.push(index);
      atomColors[index] = hexToRgbTriple(hex);
    });
    const details = {
      width: options.width ?? 460,
      height: options.height ?? 340,
      addAtomIndices: options.showAtomIndices ?? true,
      atoms,
      highlightAtomColors: atomColors,
      legend: '',
    };
    return mol.get_svg_with_highlights(JSON.stringify(details));
  } finally {
    mol.delete();
  }
}
