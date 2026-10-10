const mongoose = require('mongoose');
const Project = require('../models/Project');
const Material = require('../models/Material');
const Expense = require('../models/Expense');
const { buildCsv } = require('../utils/csv');
const { roundMoney } = require('../utils/money');

/**
 * Build CSV strings for the report/export endpoints. Kept separate from the
 * controllers so the data-shaping logic is easy to test and reuse.
 * Every function returns `{ filename, csv }`.
 */

const toDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

/** Materials belonging to one project. */
async function buildProjectMaterialsCsv(project) {
  const materials = await Material.find({ projectId: project._id })
    .sort({ createdAt: -1 })
    .lean();

  const headers = [
    'Name',
    'Category',
    'Quantity',
    'Used',
    'Current Stock',
    'Unit',
    'Unit Price',
    'Line Total',
    'Supplier',
    'Purchase Date',
    'Notes',
  ];

  const rows = materials.map((m) => {
    const quantity = m.quantity || 0;
    const used = m.usedQuantity || 0;
    return [
      m.name,
      m.category || '',
      quantity,
      used,
      Math.round((quantity - used) * 1000) / 1000,
      m.unit,
      m.unitPrice,
      roundMoney(quantity * (m.unitPrice || 0)),
      m.supplier || '',
      m.purchaseDate ? new Date(m.purchaseDate).toISOString().slice(0, 10) : '',
      m.notes || '',
    ];
  });

  return {
    filename: `project-${project.projectCode}-materials.csv`,
    csv: buildCsv(headers, rows),
  };
}

/** Expenses belonging to one project. */
async function buildProjectExpensesCsv(project) {
  const expenses = await Expense.find({ projectId: project._id })
    .sort({ expenseDate: -1 })
    .lean();

  const headers = [
    'Title',
    'Category',
    'Amount',
    'Expense Date',
    'Payment Method',
    'Payee',
    'Notes',
  ];

  const rows = expenses.map((e) => [
    e.title,
    e.category || '',
    e.amount,
    e.expenseDate ? new Date(e.expenseDate).toISOString().slice(0, 10) : '',
    e.paymentMethod || '',
    e.payee || '',
    e.notes || '',
  ]);

  return {
    filename: `project-${project.projectCode}-expenses.csv`,
    csv: buildCsv(headers, rows),
  };
}

/** One-row financial summary for a single project. */
async function buildProjectSummaryCsv(project) {
  const [materialAgg, expenseAgg] = await Promise.all([
    Material.aggregate([
      { $match: { projectId: new mongoose.Types.ObjectId(project._id) } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          estimatedValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { projectId: new mongoose.Types.ObjectId(project._id) } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]),
  ]);

  const headers = [
    'Project',
    'Code',
    'Status',
    'Location',
    'Material Entries',
    'Estimated Material Value',
    'Expense Entries',
    'Recorded Expenses',
  ];

  const rows = [
    [
      project.name,
      project.projectCode,
      project.status,
      project.location || '',
      materialAgg[0]?.count || 0,
      roundMoney(materialAgg[0]?.estimatedValue || 0),
      expenseAgg[0]?.count || 0,
      roundMoney(expenseAgg[0]?.total || 0),
    ],
  ];

  return {
    filename: `project-${project.projectCode}-summary.csv`,
    csv: buildCsv(headers, rows),
  };
}

/** Portfolio-wide rollup: one row per project with its financial totals. */
async function buildDashboardCsv() {
  const [projects, materialAgg, expenseAgg] = await Promise.all([
    Project.find().sort({ createdAt: -1 }).lean(),
    Material.aggregate([
      {
        $group: {
          _id: '$projectId',
          count: { $sum: 1 },
          estimatedValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
        },
      },
    ]),
    Expense.aggregate([
      { $group: { _id: '$projectId', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]),
  ]);

  const materialByProject = new Map(materialAgg.map((row) => [String(row._id), row]));
  const expenseByProject = new Map(expenseAgg.map((row) => [String(row._id), row]));

  const headers = [
    'Project',
    'Code',
    'Status',
    'Location',
    'Material Entries',
    'Estimated Material Value',
    'Expense Entries',
    'Recorded Expenses',
    'Created',
  ];

  const rows = projects.map((project) => {
    const material = materialByProject.get(String(project._id));
    const expense = expenseByProject.get(String(project._id));
    return [
      project.name,
      project.projectCode,
      project.status,
      project.location || '',
      material?.count || 0,
      roundMoney(material?.estimatedValue || 0),
      expense?.count || 0,
      roundMoney(expense?.total || 0),
      toDate(project.createdAt),
    ];
  });

  return { filename: 'buildtrack-dashboard.csv', csv: buildCsv(headers, rows) };
}

module.exports = {
  buildProjectMaterialsCsv,
  buildProjectExpensesCsv,
  buildProjectSummaryCsv,
  buildDashboardCsv,
};
