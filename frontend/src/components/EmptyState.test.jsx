import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

const Icon = ({ size }) => <svg data-size={size} aria-hidden="true" />;

describe('EmptyState', () => {
  it('renders title, description and action', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        icon={Icon}
        title="Nothing here"
        description="Add something to continue."
        action={<button type="button" onClick={onAction}>Add</button>}
      />
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Add something to continue.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('works without an action', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});