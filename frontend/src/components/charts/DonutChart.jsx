import './charts.css';

// A dependency-free SVG donut chart for spending by category.

const SIZE = 200;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2 - 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function totalOf(data) {
  return data.reduce((sum, row) => sum + Number(row.value || 0), 0);
}

export default function DonutChart({ data = [], formatValue = (v) => String(v) }) {
  const segments = data.filter((row) => Number(row.value) > 0);
  const total = totalOf(segments);

  if (segments.length === 0 || total <= 0) {
    return (
      <div className="chart chart--empty" role="img" aria-label="No data to chart yet">
        <span className="chart__empty-text">No data to chart yet</span>
      </div>
    );
  }

  const { arcs } = segments.reduce(
    (acc, row, index) => {
      const fraction = Number(row.value) / total;
      const dash = fraction * CIRCUMFERENCE;
      const offset = -acc.accumulated * CIRCUMFERENCE;
      acc.arcs.push({ row, index, dash, offset });
      acc.accumulated += fraction;
      return acc;
    },
    { accumulated: 0, arcs: [] }
  );

  return (
    <div className="chart chart--donut">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="chart__svg chart__svg--donut"
        role="img"
        aria-label="Donut chart of spending by category"
      >
        {arcs.map(({ row, index, dash, offset }) => (
          <circle
            key={row.label}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            className={`chart__segment chart__segment--${index % 5}`}
            strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
            strokeDashoffset={offset}
          >
            <title>{`${row.label}: ${formatValue(Number(row.value))}`}</title>
          </circle>
        ))}
        {total > 0 ? (
          <text x="50%" y="49%" textAnchor="middle" className="chart__donut-total">
            {formatValue(total)}
          </text>
        ) : null}
      </svg>

      <ul className="chart__legend">
        {arcs.map(({ row, index }) => (
          <li key={row.label} className="chart__legend-item">
            <span
              className={`chart__legend-dot chart__legend-dot--${index % 5}`}
              aria-hidden="true"
            />
            <span className="chart__legend-label">{row.label}</span>
            <span className="chart__legend-value">{formatValue(Number(row.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}