import { LimitationExplorer } from '../components/LimitationExplorer';

export function LimitationsPage() {
  return (
    <div className="limitations-page">
      <section className="panel">
        <h2>Why fingerprints can collide</h2>
        <LimitationExplorer />
      </section>
    </div>
  );
}
