import { describe, expect, it } from 'vitest';
import { formatCurrency, formatNumber } from './currency';

describe('formatCurrency', () => {
  it('formats finite numbers into a currency string', () => {
    expect(formatCurrency(1234.5)).toContain('1');
    expect(formatCurrency(0)).toBeTruthy();
  });

  it('falls back to zero for invalid input', () => {
    expect(formatCurrency('nope')).toEqual(formatCurrency(0));
    expect(formatCurrency(NaN)).toEqual(formatCurrency(0));
  });

  it('supports compact notation', () => {
    const compact = formatCurrency(1500000, { compact: true });
    expect(compact.length).toBeLessThan(formatCurrency(1500000).length);
  });
});

describe('formatNumber', () => {
  it('formats numbers without currency', () => {
    expect(formatNumber(1000)).toContain('1');
  });

  it('returns zero for invalid input', () => {
    expect(formatNumber('abc')).toBe('0');
  });
});