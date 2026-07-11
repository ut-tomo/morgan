import type { GenericGraph } from '../examples/graphCounterexamples';
import { labelColor, textOn } from './palette';

// Fixed 2D layouts (in a 0..1 box) for the two counterexample graphs.
const LAYOUTS: Record<string, Array<[number, number]>> = {
  'Triangular prism': [
    [0.25, 0.2],
    [0.1, 0.6],
    [0.4, 0.6],
    [0.75, 0.2],
    [0.6, 0.6],
    [0.9, 0.6],
  ],
  'K(3,3)': [
    [0.15, 0.2],
    [0.5, 0.2],
    [0.85, 0.2],
    [0.15, 0.8],
    [0.5, 0.8],
    [0.85, 0.8],
  ],
};

export function GenericGraphView({
  graph,
  colors,
  size = 240,
}: {
  graph: GenericGraph;
  colors: number[];
  size?: number;
}) {
  const layout = LAYOUTS[graph.name] ?? defaultLayout(graph.nodeCount);
  const pad = 26;
  const scale = size - pad * 2;
  const pos = (i: number): [number, number] => {
    const [x, y] = layout[i] ?? [0.5, 0.5];
    return [pad + x * scale, pad + y * scale];
  };
  return (
    <svg
      className="generic-graph"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${graph.name}: ${graph.description}`}
    >
      <desc>{`${graph.name}. ${graph.description} Vertices are labeled with their 1-WL color id.`}</desc>
      {graph.edges.map(([u, v], i) => {
        const [x1, y1] = pos(u);
        const [x2, y2] = pos(v);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#888"
            strokeWidth={2}
          />
        );
      })}
      {Array.from({ length: graph.nodeCount }, (_, i) => {
        const [cx, cy] = pos(i);
        const color = labelColor(colors[i] ?? 0);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={16} fill={color} stroke="#222" strokeWidth={1.5} />
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fill={textOn(color)}
            >
              {colors[i] ?? 0}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function defaultLayout(n: number): Array<[number, number]> {
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    return [0.5 + 0.4 * Math.cos(a), 0.5 + 0.4 * Math.sin(a)] as [number, number];
  });
}
