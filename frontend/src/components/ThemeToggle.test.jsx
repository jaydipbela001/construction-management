import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
  it('starts in light mode and toggles the theme attribute', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: 'Switch to dark mode' });
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    await user.click(button);
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
    expect(localStorage.getItem('bt_theme')).toBe('dark');
  });
});