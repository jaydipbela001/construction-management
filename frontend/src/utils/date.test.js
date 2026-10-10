import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, toDateInputValue } from './date';

describe('formatDate', () => {
  it('formats a date string', () => {
    expect(formatDate('2026-05-01T00:00:00.000Z')).toBeTruthy();
  });

  it('returns an em dash for empty values', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  it('returns an em dash for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('toDateInputValue', () => {
  it('converts a date to yyyy-mm-dd', () => {
    const value = toDateInputValue(new Date(2026, 4, 1));
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns empty for empty input', () => {
    expect(toDateInputValue('')).toBe('');
    expect(toDateInputValue(null)).toBe('');
  });
});

describe('formatDateTime', () => {
  it('formats date and time', () => {
    expect(formatDateTime('2026-05-01T10:30:00.000Z')).toBeTruthy();
  });

  it('handles invalid input', () => {
    expect(formatDateTime('garbage')).toBe('—');
  });
});