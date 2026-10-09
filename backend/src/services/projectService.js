const mongoose = require('mongoose');
const Project = require('../models/Project');
const Material = require('../models/Material');
const Expense = require('../models/Expense');
const ApiError = require('../utils/ApiError');
const { isObjectId } = require('../utils/helpers');
const { roundMoney } = require('../utils/money');

/**
 * Load a project or fail with a meaningful HTTP error.
 * Reused by the material and expense controllers so that every nested route
 * guarantees the parent project exists and is valid.
 *
 * @param {string} projectId
 * @returns {Promise<import('mongoose').Document>}
 */
async function findProjectOrFail(projectId) {
  if (!isObjectId(projectId)) {
    throw new ApiError(400, 'Invalid project id.');
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found.');
  }

  return project;
}

/**
 * Compute the financial summary for one project.
 * There is no stored total: it is always derived from the project's own
 * materials and expenses, keeping projects fully isolated from each other.
 *
 * NOTE: estimatedMaterialValue is what the materials are worth
 * (quantity x unitPrice). It is NOT the same as totalExpenses.
 *
 * @param {string} projectId
 * @param {import('mongoose').ClientSession|null} session
 */
async function computeProjectTotals(projectId, session = null) {
  const match = { projectId: new mongoose.Types.ObjectId(projectId) };

  const materialAgg = Material.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        materialCount: { $sum: 1 },
        estimatedMaterialValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
      },
    },
  ]);

  const expenseAgg = Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        expenseCount: { $sum: 1 },
        totalExpenses: { $sum: '$amount' },
      },
    },
  ]);

  if (session) {
    materialAgg.session(session);
    expenseAgg.session(session);
  }

  const [materialResult, expenseResult] = await Promise.all([materialAgg, expenseAgg]);
  const material = materialResult[0] || { materialCount: 0, estimatedMaterialValue: 0 };
  const expense = expenseResult[0] || { expenseCount: 0, totalExpenses: 0 };

  return {
    materialCount: material.materialCount || 0,
    expenseCount: expense.expenseCount || 0,
    estimatedMaterialValue: roundMoney(material.estimatedMaterialValue || 0),
    totalExpenses: roundMoney(expense.totalExpenses || 0),
  };
}

module.exports = { findProjectOrFail, computeProjectTotals };
