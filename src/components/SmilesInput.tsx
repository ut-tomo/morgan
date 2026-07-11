import { useState, type FormEvent } from 'react';

export function SmilesInput({
  label,
  value,
  onSubmit,
  error,
  id,
}: {
  label: string;
  value: string;
  onSubmit: (smiles: string) => void;
  error?: string | null;
  id: string;
}) {
  const [draft, setDraft] = useState(value);

  // Keep the draft in sync when the value changes from outside (e.g. presets).
  if (draft !== value && document.activeElement?.id !== id) {
    setDraft(value);
  }

  const handle = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(draft.trim());
  };

  return (
    <form className="smiles-input" onSubmit={handle}>
      <label htmlFor={id}>{label}</label>
      <div className="smiles-row">
        <input
          id={id}
          type="text"
          value={draft}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O"
          onChange={(e) => setDraft(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button type="submit">Analyze</button>
      </div>
      {error ? (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
