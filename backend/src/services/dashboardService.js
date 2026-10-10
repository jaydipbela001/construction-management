const Project = require('../models/Project');
const Material = require('../models/Material');
const Expense = require('../models/Expense');
const { roundMoney } = require('../utils/money');

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// How many months of expense history the trend chart covers.
const TREND_MONTHS = 6;

/**
 * Build a dense list of the last `TREND_MONTHS` calendar months (UTC) so the
 * chart always has a continuous x-axis even when some months have no expenses.
 */
function buildMonthBuckets(reference = new Date()) {
  const buckets = [];
  for (let i = TREND_MONTHS - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - i, 1));
    buckets.push({
      key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      label: `${MONTH_LABELS[date.getUTCMonth()]} ${String(date.getUTCFullYear()).slice(2)}`,
      total: 0,
      count: 0,
    });
  }
  return buckets;
}

/**
 * Merge month aggregation rows into the dense buckets, keeping chronological
 * order. Exported for unit testing.
 */
function mergeExpenseTrend(buckets, rows = []) {
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  for (const row of rows) {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.total = roundMoney(row.total || 0);
      bucket.count = row.count || 0;
    }
  }
  return buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    total: bucket.total,
    count: bucket.count,
  }));
}

/**
 * Build the data shown on the global dashboard:
 *   - aggregate counts + totals across all projects
 *   - chart series (expense trend, expenses by category, projects by status)
 *   - the 5 most recent projects, materials and expenses
 *
 * The aggregations run in parallel for speed. Totals are always derived from
 * the source collections, never stored.
 */
async function getDashboardSummary() {
  const buckets = buildMonthBuckets();
  const trendStart = new Date(`${buckets[0].key}-01T00:00:00.000Z`);

  const [
    projectStatusAgg,
    materialAgg,
    expenseAgg,
    trendAgg,
    categoryAgg,
    recentProjects,
    recentMaterials,
    recentExpenses,
  ] = await Promise.all([
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
    Expense.aggregate([{ $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
    Expense.aggregate([
      { $match: { expenseDate: { $gte: trendStart } } },
      {
        $group: {
          _id: { year: { $year: '$expenseDate' }, month: { $month: '$expenseDate' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$category', 'miscellaneous'] },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
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
    charts: {
      expenseTrend: mergeExpenseTrend(buckets, trendAgg),
      expensesByCategory: categoryAgg.map((row) => ({
        category: row._id,
        total: roundMoney(row.total || 0),
        count: row.count || 0,
      })),
      projectsByStatus: [
        { status: 'planned', count: statusCounts.planned },
        { status: 'active', count: statusCounts.active },
        { status: 'on_hold', count: statusCounts.on_hold },
        { status: 'completed', count: statusCounts.completed },
      ],
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

module.exports = { getDashboardSummary, buildMonthBuckets, mergeExpenseTrend, TREND_MONTHS };
