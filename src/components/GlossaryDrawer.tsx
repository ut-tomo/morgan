import { useEffect, useRef } from 'react';

const TERMS: Array<{ term: string; def: string }> = [
  {
    term: 'Refined atom identifier',
    def: 'A refined atom identifier summarizes a rooted local environment.',
  },
  {
    term: 'Circular / Morgan environment',
    def: 'These are circular, atom-centered environments, not arbitrary subgraphs. Modern Morgan fingerprints collect identifiers from atoms and radii as molecular features.',
  },
  {
    term: 'Morgan 1965',
    def: 'Morgan 1965 used refinement to reduce the canonicalization search. Modern circular fingerprints retain the refined local descriptions as features.',
  },
  {
    term: '1-WL refinement',
    def: '1-WL distinguishing two graphs proves they are non-isomorphic. 1-WL failing to distinguish them does not prove they are isomorphic. It is not a complete graph-isomorphism test.',
  },
  {
    term: 'Fingerprint vs isomorphism',
    def: 'Different graphs can have the same fingerprint. Same fingerprint does not imply graph isomorphism. A fingerprint does not uniquely identify a molecule.',
  },
  {
    term: 'Tanimoto similarity',
    def: 'T = |A ∩ B| / (|A| + |B| − |A ∩ B|). It compares feature sets, not graphs.',
  },
];

export function GlossaryDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={open ? 'drawer-backdrop open' : 'drawer-backdrop'}
      onClick={onClose}
      aria-hidden={!open}
    >
      <aside
        className="glossary-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Glossary"
        hidden={!open}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <h2>Glossary</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close glossary">
            ✕
          </button>
        </div>
        <dl className="glossary-list">
          {TERMS.map((t) => (
            <div key={t.term}>
              <dt>{t.term}</dt>
              <dd>{t.def}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
