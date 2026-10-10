import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';

describe('StatCard', () => {
  it('renders label, value and hint', () => {
    render(<StatCard label="Total Projects" value="12" hint="Across everything" />);
    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Across everything')).toBeInTheDocument();
  });

  it('applies the tone class', () => {
    const { container } = render(<StatCard label="X" value="1" tone="success" />);
    expect(container.querySelector('.stat-card--success')).toBeInTheDocument();
  });

  it('shows a skeleton while loading', () => {
    const { container } = render(<StatCard label="X" value="1" loading />);
    expect(container.querySelector('.stat-card__skeleton')).toBeInTheDocument();
  });
});