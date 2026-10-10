import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import LineChart from './LineChart';
import DonutChart from './DonutChart';
import BarChart from './BarChart';

describe('LineChart', () => {
  it('renders an accessible chart when there is data', () => {
    const { container } = render(
      <LineChart data={[{ key: 'm1', label: 'May', value: 100 }, { key: 'm2', label: 'Jun', value: 250 }]} />
    );
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(container.querySelector('.chart__line')).toBeInTheDocument();
  });

  it('renders an empty state without data', () => {
    render(<LineChart data={[]} />);
    expect(screen.getByText('No data to chart yet')).toBeInTheDocument();
  });
});

describe('DonutChart', () => {
  it('renders a legend of categories', () => {
    render(
      <DonutChart
        data={[
          { label: 'labor', value: 400 },
          { label: 'material', value: 600 },
        ]}
      />
    );
    expect(screen.getByText('labor')).toBeInTheDocument();
    expect(screen.getByText('material')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders an empty state when all values are zero', () => {
    render(<DonutChart data={[{ label: 'labor', value: 0 }]} />);
    expect(screen.getByText('No data to chart yet')).toBeInTheDocument();
  });
});

describe('BarChart', () => {
  it('renders a row per entry', () => {
    render(
      <BarChart
        data={[
          { label: 'Active', value: 2 },
          { label: 'Planned', value: 1 },
        ]}
      />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
  });

  it('renders an empty state without usable rows', () => {
    render(<BarChart data={[]} />);
    expect(screen.getByText('No data to chart yet')).toBeInTheDocument();
  });
});