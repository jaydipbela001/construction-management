// Pure unit tests that need no database. Run with `npm test --prefix backend`.
const test = require('node:test');
const assert = require('node:assert/strict');

const { escapeCell, buildCsv } = require('../src/utils/csv');
const {
  buildMonthBuckets,
  mergeExpenseTrend,
  TREND_MONTHS,
} = require('../src/services/dashboardService');
const {
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  MIN_PASSWORD_LENGTH,
} = require('../src/validators/authValidator');

test('csv: escapeCell quotes values that need it', () => {
  assert.equal(escapeCell('plain'), 'plain');
  assert.equal(escapeCell(42), '42');
  assert.equal(escapeCell(null), '');
  assert.equal(escapeCell(undefined), '');
  assert.equal(escapeCell('a,b'), '"a,b"');
  assert.equal(escapeCell('say "hi"'), '"say ""hi"""');
  assert.equal(escapeCell('line1\nline2'), '"line1\nline2"');
});

test('csv: buildCsv joins headers and rows with CRLF', () => {
  const csv = buildCsv(['Name', 'Qty'], [['Cement', 10], ['Iron', 5]]);
  assert.equal(csv, 'Name,Qty\r\nCement,10\r\nIron,5');
});

test('dashboard: buildMonthBuckets returns a dense ordered window', () => {
  const buckets = buildMonthBuckets(new Date('2026-10-15T00:00:00.000Z'));
  assert.equal(buckets.length, TREND_MONTHS);
  assert.equal(buckets[buckets.length - 1].key, '2026-10');
  assert.deepEqual(
    buckets.map((b) => b.total),
    new Array(TREND_MONTHS).fill(0)
  );
  // Chronological order is preserved.
  assert.ok(buckets[0].key < buckets[buckets.length - 1].key);
});

test('dashboard: mergeExpenseTrend fills matching months and keeps zeros', () => {
  const buckets = buildMonthBuckets(new Date('2026-10-15T00:00:00.000Z'));
  const merged = mergeExpenseTrend(buckets, [
    { _id: { year: 2026, month: 10 }, total: 1234.567, count: 3 },
    { _id: { year: 2026, month: 8 }, total: 500, count: 1 },
  ]);
  const october = merged.find((m) => m.key === '2026-10');
  const august = merged.find((m) => m.key === '2026-08');
  const september = merged.find((m) => m.key === '2026-09');
  assert.equal(october.total, 1234.57);
  assert.equal(october.count, 3);
  assert.equal(august.total, 500);
  assert.equal(september.total, 0);
});

test('auth validator: login requires email and password', () => {
  assert.throws(() => validateLogin({}), { statusCode: 400 });
  const clean = validateLogin({ email: '  Admin@Example.COM ', password: 'secret' });
  assert.equal(clean.email, 'admin@example.com');
  assert.equal(clean.password, 'secret');
});

test('auth validator: update profile requires at least one field', () => {
  assert.throws(() => validateUpdateProfile({}), { statusCode: 400 });
  assert.throws(() => validateUpdateProfile({ email: 'not-an-email' }), { statusCode: 400 });
  assert.deepEqual(validateUpdateProfile({ name: '  Site Lead ' }), { name: 'Site Lead' });
  assert.deepEqual(validateUpdateProfile({ email: ' New@Mail.COM ' }), {
    email: 'new@mail.com',
  });
});

test('auth validator: change password enforces strength and difference', () => {
  assert.throws(
    () => validateChangePassword({ currentPassword: 'oldpass1', newPassword: 'oldpass1' }),
    { statusCode: 400 }
  );
  assert.throws(
    () => validateChangePassword({ currentPassword: 'oldpass1', newPassword: 'short' }),
    { statusCode: 400 }
  );
  const clean = validateChangePassword({
    currentPassword: 'oldpass1',
    newPassword: 'x'.repeat(MIN_PASSWORD_LENGTH),
  });
  assert.equal(clean.newPassword.length, MIN_PASSWORD_LENGTH);
});
