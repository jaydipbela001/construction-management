import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataTable from './DataTable';

const rows = [
  { _id: '1', name: 'Alpha' },
  { _id: '2', name: 'Beta' },
];

const columns = [
  { key: 'name', header: 'Project' },
  { key: 'cost', header: 'Cost', align: 'right', render: (row) => `$${row.cost ?? 0}` },
];

describe('DataTable', () => {
  it('renders column headers and cell content', () => {
    render(<DataTable columns={columns} rows={rows} ariaLabel="Projects" />);
    expect(screen.getByRole('table', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getAllByText('$0')).toHaveLength(2);
  });

  it('shows the empty component when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} empty={<div>No data</div>} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('shows a loading state while loading', () => {
    const { container } = render(
      <DataTable columns={columns} rows={[]} loading empty={<div>No data</div>} />
    );
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('invokes onRowClick with the row', () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} rows={rows} ariaLabel="Projects" onRowClick={onRowClick} />);
    screen.getByText('Alpha').closest('tr').click();
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });
});