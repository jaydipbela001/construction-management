import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useDebounce } from './useDebounce';

function Probe({ value, delay }) {
  const debounced = useDebounce(value, delay);
  return <div data-testid="probe">{debounced}</div>;
}

describe('useDebounce', () => {
  it('delays propagation of the value', async () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(<Probe value="first" delay={400} />);
      expect(screen.getByTestId('probe').textContent).toBe('first');

      rerender(<Probe value="second" delay={400} />);
      expect(screen.getByTestId('probe').textContent).toBe('first');

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(screen.getByTestId('probe').textContent).toBe('second');
    } finally {
      vi.useRealTimers();
    }
  });
});