const express = require('express');
const {
  listExpenses,
  createExpense,
  getExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { validateRequest } = require('../middleware/validateRequest');
const { validateCreateExpense, validateUpdateExpense } = require('../validators/expenseValidator');

// mergeParams lets this router read :projectId from the parent route.
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(listExpenses)
  .post(validateRequest(validateCreateExpense), createExpense);

router
  .route('/:expenseId')
  .get(getExpense)
  .patch(validateRequest(validateUpdateExpense), updateExpense)
  .delete(deleteExpense);

module.exports = router;
