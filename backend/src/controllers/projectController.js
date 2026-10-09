const mongoose = require('mongoose');
const Project = require('../models/Project');
const Material = require('../models/Material');
const Expense = require('../models/Expense');
const ApiError = require('../utils/ApiError');
const { parsePagination, escapeRegex } = require('../utils/pagination');
const { generateProjectCode } = require('../utils/generateProjectCode');
const { findProjectOrFail, computeProjectTotals } = require('../services/projectService');

const PROJECT_STATUSES = Project.PROJECT_STATUSES;
const SORTABLE_FIELDS = ['name', 'projectCode', 'status', 'startDate', 'createdAt', 'updatedAt'];

/**
 * GET /api/projects
 * Supports ?search= (name/code), ?status=, ?sortBy=, ?order= and pagination.
 */
async function listProjects(req, res, next) {
  try {
    const { search, status, sortBy = 'createdAt', order = 'desc' } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const query = {};
    if (status && PROJECT_STATUSES.includes(status)) {
      query.status = status;
    }
    if (search && String(search).trim()) {
      const pattern = new RegExp(escapeRegex(String(search).trim()), 'i');
      query.$or = [{ name: pattern }, { projectCode: pattern }];
    }

    const sortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      Project.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      Project.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/projects
 * Creates an empty project. Materials/expenses are NEVER copied or created
 * here, so every new project starts with zero data.
 */
async function createProject(req, res, next) {
  try {
    const data = { ...req.body };

    if (!data.projectCode) {
      data.projectCode = await generateProjectCode();
    }

    const duplicate = await Project.exists({ projectCode: data.projectCode });
    if (duplicate) {
      throw new ApiError(409, 'A project with this project code already exists.', {
        projectCode: 'Project code must be unique',
      });
    }

    const project = await Project.create(data);

    return res.status(201).json({ success: true, data: { project } });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/projects/:projectId
 * Returns the project plus its derived totals.
 */
async function getProject(req, res, next) {
  try {
    const project = await findProjectOrFail(req.params.projectId);
    const totals = await computeProjectTotals(project._id);

    return res.status(200).json({ success: true, data: { project, totals } });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/projects/:projectId
 * Partial update; body is validated/sanitized by validateRequest.
 */
async function updateProject(req, res, next) {
  try {
    const project = await findProjectOrFail(req.params.projectId);
    const data = req.body;

    if (data.projectCode && data.projectCode !== project.projectCode) {
      const duplicate = await Project.exists({
        projectCode: data.projectCode,
        _id: { $ne: project._id },
      });
      if (duplicate) {
        throw new ApiError(409, 'A project with this project code already exists.', {
          projectCode: 'Project code must be unique',
        });
      }
    }

    Object.assign(project, data);
    await project.save();

    return res.status(200).json({ success: true, data: { project } });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/projects/:projectId
 * Cascade policy: delete only THIS project's materials and expenses, then the
 * project itself. A MongoDB transaction is used when supported; standalone
 * MongoDB falls back to ordered deletes.
 */
async function deleteProject(req, res, next) {
  try {
    const project = await findProjectOrFail(req.params.projectId);

    let session = null;
    try {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        await Material.deleteMany({ projectId: project._id }, { session });
        await Expense.deleteMany({ projectId: project._id }, { session });
        await Project.deleteOne({ _id: project._id }, { session });
      });
    } catch (transactionError) {
      // Standalone MongoDB does not support transactions.
      if (session) await session.endSession();
      session = null;
      await Material.deleteMany({ projectId: project._id });
      await Expense.deleteMany({ projectId: project._id });
      await Project.deleteOne({ _id: project._id });
    } finally {
      if (session) await session.endSession();
    }

    return res.status(200).json({
      success: true,
      data: { message: 'Project and its related records were deleted.', id: project._id },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listProjects, createProject, getProject, updateProject, deleteProject };
