const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const ApiError = require('../utils/ApiError');
const { isEmpty, isObjectId } = require('../utils/helpers');
const { parsePagination, escapeRegex } = require('../utils/pagination');
const { roundMoney } = require('../utils/money');
const { findProjectOrFail } = require('../services/projectService');

const SORTABLE_FIELDS = ['title', 'category', 'amount', 'expenseDate', 'createdAt'];

/**
 * GET /api/projects/:projectId/expenses
 * Lists only this project's expenses. Supports ?search=, ?category=,
 * ?from=, ?to=, ?sortBy=, ?order= and pagination.
 */
async function listExpenses(req, res, next) {
  try {
    const { projectId } = req.params;
    await findProjectOrFail(projectId);

    const { search, category, from, to, sortBy = 'expenseDate', order = 'desc' } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const query = { projectId };
    if (category && String(category).trim()) {
      query.category = String(category).trim();
    }
    if (search && String(search).trim()) {
      const pattern = new RegExp(escapeRegex(String(search).trim()), 'i');
      query.$or = [{ title: pattern }, { payee: pattern }];
    }
    if (!isEmpty(from) || !isEmpty(to)) {
      query.expenseDate = {};
      if (!isEmpty(from)) {
        const date = new Date(from);
        if (Number.isNaN(date.getTime())) throw new ApiError(400, 'Invalid "from" date.');
        query.expenseDate.$gte = date;
      }
      if (!isEmpty(to)) {
        const date = new Date(to);
        if (Number.isNaN(date.getTime())) throw new ApiError(400, 'Invalid "to" date.');
        date.setHours(23, 59, 59, 999);
        query.expenseDate.$lte = date;
      }
    }

    const sortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'expenseDate';
    const sortOrder = order === 'asc' ? 1 : -1;

    const [items, total, totalAgg] = await Promise.all([
      Expense.find(query).sort({ [sortField]: sortOrder }).skip(skip).limit(limit).lean(),
      Expense.countDocuments(query),
      Expense.aggregate([
        { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items,
        summary: {
          totalExpenses: roundMoney(totalAgg[0]?.total || 0),
          expenseCount: totalAgg[0]?.count || 0,
        },
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/projects/:projectId/expenses
 * Body already validated by validateRequest(validateCreateExpense).
 */
async function createExpense(req, res, next) {
  try {
    const { projectId } = req.params;
    await findProjectOrFail(projectId);

    const expense = await Expense.create({ ...req.body, projectId });

    return res.status(201).json({ success: true, data: { expense } });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/projects/:projectId/expenses/:expenseId
 */
async function getExpense(req, res, next) {
  try {
    const { projectId, expenseId } = req.params;
    await findProjectOrFail(projectId);

    if (!isObjectId(expenseId)) {
      throw new ApiError(400, 'Invalid expense id.');
    }

    const expense = await Expense.findOne({ _id: expenseId, projectId });
    if (!expense) {
      throw new ApiError(404, 'Expense not found in this project.');
    }

    return res.status(200).json({ success: true, data: { expense } });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/projects/:projectId/expenses/:expenseId
 */
async function updateExpense(req, res, next) {
  try {
    const { projectId, expenseId } = req.params;
    await findProjectOrFail(projectId);

    if (!isObjectId(expenseId)) {
      throw new ApiError(400, 'Invalid expense id.');
    }

    const expense = await Expense.findOne({ _id: expenseId, projectId });
    if (!expense) {
      throw new ApiError(404, 'Expense not found in this project.');
    }

    Object.assign(expense, req.body);
    await expense.save();

    return res.status(200).json({ success: true, data: { expense } });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/projects/:projectId/expenses/:expenseId
 */
async function deleteExpense(req, res, next) {
  try {
    const { projectId, expenseId } = req.params;
    await findProjectOrFail(projectId);

    if (!isObjectId(expenseId)) {
      throw new ApiError(400, 'Invalid expense id.');
    }

    const result = await Expense.deleteOne({ _id: expenseId, projectId });
    if (result.deletedCount === 0) {
      throw new ApiError(404, 'Expense not found in this project.');
    }

    return res
      .status(200)
      .json({ success: true, data: { message: 'Expense deleted.', id: expenseId } });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listExpenses, createExpense, getExpense, updateExpense, deleteExpense };
