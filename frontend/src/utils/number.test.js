import { describe, expect, it } from 'vitest';
import { round2, toNumberOrNull } from './number';

describe('round2', () => {
  it('rounds to two decimals', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.5)).toBe(2.5);
  });

  it('returns 0 for invalid input', () => {
    expect(round2('nope')).toBe(0);
    expect(round2(NaN)).toBe(0);
  });
});

describe('toNumberOrNull', () => {
  it('parses numeric strings', () => {
    expect(toNumberOrNull('12.5')).toBe(12.5);
    expect(toNumberOrNull(0)).toBe(0);
  });

  it('returns null for empty or invalid values', () => {
    expect(toNumberOrNull('')).toBeNull();
    expect(toNumberOrNull(null)).toBeNull();
    expect(toNumberOrNull(undefined)).toBeNull();
    expect(toNumberOrNull('abc')).toBeNull();
  });
});