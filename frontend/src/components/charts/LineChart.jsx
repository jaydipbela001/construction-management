import { useId } from 'react';
import './charts.css';

// A dependency-free SVG line chart used for the monthly expense trend.
// Pure presentational component: no fetch, no state apart from a generated id.

const WIDTH = 600;
const HEIGHT = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 52 };
const GRID_LINES = 4;

function niceMax(value) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export default function LineChart({ data = [], formatValue = (v) => String(v), height = 240 }) {
  const points = data.filter((d) => Number.isFinite(Number(d.value)));
  const gradientId = useId().replace(/:/g, '');

  if (points.length === 0) {
    return (
      <div className="chart chart--empty" role="img" aria-label="No data to chart yet">
        <span className="chart__empty-text">No data to chart yet</span>
      </div>
    );
  }

  const maxValue = niceMax(Math.max(...points.map((d) => Number(d.value))));
  const minValue = 0;

  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;

  const x = (index) =>
    PAD.left + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
  const y = (value) =>
    PAD.top + innerHeight - ((value - minValue) / (maxValue - minValue)) * innerHeight;

  const linePath = points.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(Number(d.value)).toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L${x(points.length - 1).toFixed(2)},${PAD.top + innerHeight} L${x(0).toFixed(2)},${PAD.top + innerHeight} Z`;

  const gridValues = Array.from({ length: GRID_LINES + 1 }, (_, i) => (maxValue / GRID_LINES) * i);
  const labelStep = Math.ceil(points.length / 6);

  return (
    <div className="chart chart--line">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ height }}
        role="img"
        aria-label="Line chart of monthly spending"
        className="chart__svg"
      >
        <defs>
          <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridValues.map((value) => {
          const gridY = y(value);
          return (
            <g key={value} className="chart__grid">
              <line x1={PAD.left} y1={gridY} x2={WIDTH - PAD.right} y2={gridY} />
              <text x={PAD.left - 8} y={gridY + 4} textAnchor="end" className="chart__axis-label">
                {formatValue(value)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#area-${gradientId})`} />
        <path d={linePath} fill="none" className="chart__line" />

        {points.map((d, i) => (
          <circle key={d.key ?? i} cx={x(i)} cy={y(Number(d.value))} r={3.5} className="chart__dot">
            <title>{`${d.label}: ${formatValue(Number(d.value))}`}</title>
          </circle>
        ))}

        {points.map((d, i) =>
          i % labelStep === 0 ? (
            <text
              key={`label-${i}`}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="chart__axis-label"
            >
              {d.label}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}