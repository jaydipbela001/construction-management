const { EXPENSE_CATEGORIES } = require('../models/Expense');
const ApiError = require('../utils/ApiError');
const { isEmpty } = require('../utils/helpers');

/**
 * Parse a required, non-negative amount.
 */
function parseAmount(value, errors) {
  if (isEmpty(value)) {
    errors.amount = 'Amount must be a valid number';
    return undefined;
  }
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    errors.amount = 'Amount must be a valid number';
    return undefined;
  }
  if (amount < 0) {
    errors.amount = 'Amount cannot be negative';
    return undefined;
  }
  return amount;
}

/**
 * Shared builder for create (partial: false) and update (partial: true).
 */
function buildExpenseData(body = {}, { partial }) {
  const errors = {};
  const data = {};

  if (!partial || body.title !== undefined) {
    if (isEmpty(body.title)) errors.title = 'Expense title is required';
    else data.title = String(body.title).trim();
  }

  if (!partial || body.amount !== undefined) {
    const amount = parseAmount(body.amount, errors);
    if (amount !== undefined) data.amount = amount;
  }

  if (!partial || body.category !== undefined) {
    const category = isEmpty(body.category) ? 'miscellaneous' : String(body.category).trim();
    if (!EXPENSE_CATEGORIES.includes(category)) {
      errors.category = `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`;
    } else {
      data.category = category;
    }
  }

  if (body.paymentMethod !== undefined) data.paymentMethod = String(body.paymentMethod || '').trim();
  if (body.payee !== undefined) data.payee = String(body.payee || '').trim();
  if (body.notes !== undefined) data.notes = String(body.notes || '').trim();

  if (body.expenseDate !== undefined) {
    if (isEmpty(body.expenseDate)) {
      data.expenseDate = new Date();
    } else {
      const date = new Date(body.expenseDate);
      if (Number.isNaN(date.getTime())) errors.expenseDate = 'Invalid expense date';
      else data.expenseDate = date;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  return data;
}

/** POST /api/projects/:projectId/expenses */
const validateCreateExpense = (body) => buildExpenseData(body, { partial: false });

/** PATCH /api/projects/:projectId/expenses/:expenseId */
const validateUpdateExpense = (body) => buildExpenseData(body, { partial: true });

module.exports = { validateCreateExpense, validateUpdateExpense };
