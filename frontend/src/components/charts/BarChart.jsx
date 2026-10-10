import './charts.css';

// A dependency-free horizontal bar chart for counts (e.g. projects by status).

export default function BarChart({ data = [], formatValue = (v) => String(v) }) {
  const items = data.map((row) => ({ label: row.label, value: Number(row.value || 0) }));
  const visible = items.filter((row) => row.label !== undefined);

  if (visible.length === 0) {
    return (
      <div className="chart chart--empty" role="img" aria-label="No data to chart yet">
        <span className="chart__empty-text">No data to chart yet</span>
      </div>
    );
  }

  const maxValue = Math.max(1, ...visible.map((row) => row.value));

  return (
    <div className="chart chart--bars">
      <ul className="chart__bars" role="list" aria-label="Bar chart">
        {visible.map((row, index) => {
          const width = (row.value / maxValue) * 100;
          return (
            <li key={row.label} className="chart__bar-row">
              <span className="chart__bar-label">{row.label}</span>
              <span className="chart__bar-track">
                <span
                  className={`chart__bar-fill chart__bar-fill--${index % 5}`}
                  style={{ width: `${width}%` }}
                >
                  <span className="chart__bar-value">{formatValue(row.value)}</span>
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}