// Renders an RDKit-produced SVG. The SVG comes straight from the RDKit adapter;
// we only wrap it with an accessible description.
import { useMemo } from 'react';

export function MoleculeViewer({
  svg,
  description,
  caption,
}: {
  svg: string;
  description: string;
  caption?: string;
}) {
  // Inject an accessible <title>/<desc> and role into the RDKit SVG.
  const accessibleSvg = useMemo(
    () => makeSvgAccessible(svg, description),
    [svg, description],
  );
  return (
    <figure className="molecule-viewer">
      <div
        className="molecule-svg"
        // RDKit generates trusted SVG markup for the parsed molecule.
        dangerouslySetInnerHTML={{ __html: accessibleSvg }}
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function makeSvgAccessible(svg: string, description: string): string {
  const safeDesc = description
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Add role + aria-label and an embedded <desc> right after the opening <svg>.
  return svg.replace(
    /<svg([^>]*)>/,
    `<svg$1 role="img" aria-label="${safeDesc}"><desc>${safeDesc}</desc>`,
  );
}
