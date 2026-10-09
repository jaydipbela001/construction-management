import LoadingSpinner from './LoadingSpinner';
import './DataTable.css';

export default function DataTable({
  columns,
  rows,
  rowKey = (row) => row._id || row.id,
  loading = false,
  empty,
  onRowClick,
  ariaLabel,
  renderMobileCard,
}) {
  if (loading) {
    return (
      <div className="data-table__loading">
        <LoadingSpinner label="Loading data…" />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <div className="data-table__empty">{empty}</div>;
  }

  return (
    <div className={`table-wrap data-table ${renderMobileCard ? 'data-table--cards' : ''}`}>
      <table className="table" aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.align === 'right' ? 'num' : undefined}
                style={col.width ? { width: col.width } : undefined}
                scope="col"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'data-table__row--clickable' : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.align === 'right' ? 'num' : undefined}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {renderMobileCard ? (
        <ul className="data-table__cards">
          {rows.map((row) => (
            <li key={rowKey(row)} className="data-table__card">
              {renderMobileCard(row)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
