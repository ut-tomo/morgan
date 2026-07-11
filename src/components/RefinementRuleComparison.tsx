// Explains how Morgan's 1965 neighbor-SUM update relates to — but differs from —
// 1-WL's neighbor-MULTISET update, with a concrete information-loss example.
//
// The canonical counterexample: a vertex whose neighbors carry values {1, 3}
// and another whose neighbors carry {2, 2}. Both SUM to 4, so Morgan's rule
// gives them the same new value; but their multisets differ, so 1-WL keeps them
// apart. This is why modern circular fingerprints use the multiset (labeled
// 1-WL) rather than the raw sum.
import { LabelChip } from './LabelChip';
import { sumVsMultiset } from '../refinement/ruleComparison';

export function RefinementRuleComparison() {
  const demo = sumVsMultiset([1, 3], [2, 2]);
  return (
    <section className="panel rule-comparison">
      <h3>How Morgan 1965 relates to 1-WL (and why modern fingerprints differ)</h3>
      <div className="rule-grid">
        <div className="rule-card">
          <h4>Morgan 1965 update</h4>
          <p>
            new value(atom) = <strong>sum</strong> of the neighbors' current
            values.
          </p>
        </div>
        <div className="rule-card">
          <h4>1-WL update</h4>
          <p>
            new label(atom) = (own label,{' '}
            <strong>sorted multiset</strong> of neighbors' labels), with bond
            labels included.
          </p>
        </div>
      </div>

      <p className="panel-intro">
        These are historically and algorithmically related — both refine a
        vertex from its neighbours — but they are <strong>not identical</strong>.
        A sum throws away <em>which</em> values were combined; a multiset does
        not. So 1-WL is at least as discriminating as the neighbour-sum, and the
        educational WL mode and modern Morgan/circular fingerprints use the{' '}
        <strong>multiset</strong> rule (labeled 1-WL), which is structurally
        closer to modern ECFP than Morgan's original sum.
      </p>

      <div className="sum-demo">
        <p className="demo-caption">
          Concrete information loss — two different neighbourhoods, same sum:
        </p>
        <table className="data-table">
          <caption className="sr-only">Sum versus multiset on two neighbourhoods</caption>
          <thead>
            <tr>
              <th scope="col">Neighbour values</th>
              <th scope="col">Morgan sum</th>
              <th scope="col">1-WL multiset</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                {demo.a.map((v, i) => (
                  <LabelChip key={i} label={v} />
                ))}
              </th>
              <td>{demo.sumA}</td>
              <td>
                <code>{`{${demo.a.slice().sort((x, y) => x - y).join(', ')}}`}</code>
              </td>
            </tr>
            <tr>
              <th scope="row">
                {demo.b.map((v, i) => (
                  <LabelChip key={i} label={v} />
                ))}
              </th>
              <td>{demo.sumB}</td>
              <td>
                <code>{`{${demo.b.slice().sort((x, y) => x - y).join(', ')}}`}</code>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="hint">
          Morgan's sum gives both the same value ({demo.sumA}), so it{' '}
          <strong>merges</strong> them; the multisets differ, so 1-WL{' '}
          <strong>separates</strong> them (
          {demo.multisetsEqual ? 'multisets equal' : 'multisets differ'}). This
          is a mechanism-2 (refinement-expressivity) effect at the level of a
          single update.
        </p>
      </div>
    </section>
  );
}
