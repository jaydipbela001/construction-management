const Project = require('../models/Project');
const Material = require('../models/Material');
const Expense = require('../models/Expense');
const { roundMoney } = require('../utils/money');

/**
 * Build the data shown on the global dashboard:
 *   - aggregate counts + totals across all projects
 *   - the 5 most recent projects, materials and expenses
 *
 * The aggregations run in parallel for speed. Totals are always derived from
 * the source collections, never stored.
 */
async function getDashboardSummary() {
  const [projectStatusAgg, materialAgg, expenseAgg, recentProjects, recentMaterials, recentExpenses] =
    await Promise.all([
      Project.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Material.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            estimatedValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
          },
        },
      ]),
      Expense.aggregate([
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      Project.find().sort({ createdAt: -1 }).limit(5).lean(),
      Material.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('projectId', 'name projectCode')
        .lean({ virtuals: true }),
      Expense.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('projectId', 'name projectCode')
        .lean(),
    ]);

  const statusCounts = { planned: 0, active: 0, on_hold: 0, completed: 0 };
  let totalProjects = 0;
  for (const row of projectStatusAgg) {
    statusCounts[row._id] = row.count;
    totalProjects += row.count;
  }

  return {
    stats: {
      totalProjects,
      activeProjects: statusCounts.active,
      completedProjects: statusCounts.completed,
      plannedProjects: statusCounts.planned,
      onHoldProjects: statusCounts.on_hold,
      totalMaterialEntries: materialAgg[0]?.count || 0,
      totalEstimatedMaterialValue: roundMoney(materialAgg[0]?.estimatedValue || 0),
      totalRecordedExpenses: roundMoney(expenseAgg[0]?.total || 0),
      totalExpenseEntries: expenseAgg[0]?.count || 0,
    },
    recentProjects,
    recentMaterials: recentMaterials.map((material) => {
      const quantity = material.quantity || 0;
      const usedQuantity = material.usedQuantity || 0;
      return {
        ...material,
        lineTotal: roundMoney(quantity * (material.unitPrice || 0)),
        currentStock: Math.round((quantity - usedQuantity) * 1000) / 1000,
      };
    }),
    recentExpenses,
  };
}

module.exports = { getDashboardSummary };
