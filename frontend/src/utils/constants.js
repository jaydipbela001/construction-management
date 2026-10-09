export const PROJECT_STATUSES = [
  { value: 'planned', label: 'Planned', tone: 'info' },
  { value: 'active', label: 'Active', tone: 'success' },
  { value: 'on_hold', label: 'On Hold', tone: 'warning' },
  { value: 'completed', label: 'Completed', tone: 'neutral' },
];

export const STATUS_TONE = PROJECT_STATUSES.reduce((acc, s) => {
  acc[s.value] = s.tone;
  return acc;
}, {});

export const STATUS_LABEL = PROJECT_STATUSES.reduce((acc, s) => {
  acc[s.value] = s.label;
  return acc;
}, {});

export const MATERIAL_UNITS = [
  'kg',
  'ton',
  'bag',
  'piece',
  'cubic meter',
  'liter',
  'meter',
  'square meter',
  'roll',
  'custom',
];

export const EXPENSE_CATEGORIES = [
  'material',
  'labor',
  'equipment',
  'transport',
  'permits',
  'utilities',
  'miscellaneous',
];

export const PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
  'cheque',
  'credit_card',
  'debit_card',
  'upi',
  'other',
];

export const PAGE_SIZE = 10;
