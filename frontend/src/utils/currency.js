// Central currency configuration. Change VITE_CURRENCY / VITE_LOCALE to
// switch currencies across the entire app without touching components.
const CURRENCY = import.meta.env.VITE_CURRENCY || 'INR';
const LOCALE = import.meta.env.VITE_LOCALE || 'en-IN';

const formatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCurrency(value, { compact = false } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return compact ? compactFormatter.format(0) : formatter.format(0);
  return compact ? compactFormatter.format(n) : formatter.format(n);
}

export function formatNumber(value, options = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat(LOCALE, options).format(n);
}

export { CURRENCY, LOCALE };
