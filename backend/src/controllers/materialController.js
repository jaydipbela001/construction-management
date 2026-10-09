const mongoose = require('mongoose');
const Material = require('../models/Material');
const ApiError = require('../utils/ApiError');
const { isObjectId } = require('../utils/helpers');
const { parsePagination, escapeRegex } = require('../utils/pagination');
const { roundMoney } = require('../utils/money');
const { findProjectOrFail } = require('../services/projectService');

const SORTABLE_FIELDS = ['name', 'category', 'quantity', 'unitPrice', 'createdAt', 'purchaseDate'];

/**
 * Used quantity can never be more than the total purchased quantity.
 * @param {number} quantity
 * @param {number} usedQuantity
 */
function assertUsedNotExceedingTotal(quantity, usedQuantity) {
  if (usedQuantity > quantity) {
    throw new ApiError(400, 'Validation failed', {
      usedQuantity: 'Used quantity cannot exceed the total quantity',
    });
  }
}

/**
 * GET /api/projects/:projectId/materials
 * Lists only this project's materials (isolation is enforced by projectId).
 */
async function listMaterials(req, res, next) {
  try {
    const { projectId } = req.params;
    await findProjectOrFail(projectId);

    const { search, category, sortBy = 'createdAt', order = 'desc' } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const query = { projectId };
    if (category && String(category).trim()) {
      query.category = new RegExp(`^${escapeRegex(String(category).trim())}$`, 'i');
    }
    if (search && String(search).trim()) {
      const pattern = new RegExp(escapeRegex(String(search).trim()), 'i');
      query.$or = [{ name: pattern }, { supplier: pattern }];
    }

    const sortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    // Summary always reflects the whole project, independent of filters/paging.
    const [items, total, summaryAgg] = await Promise.all([
      Material.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      Material.countDocuments(query),
      Material.aggregate([
        { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const enriched = items.map((material) => {
      const quantity = material.quantity || 0;
      const usedQuantity = material.usedQuantity || 0;
      return {
        ...material,
        lineTotal: roundMoney(quantity * (material.unitPrice || 0)),
        currentStock: Math.round((quantity - usedQuantity) * 1000) / 1000,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        items: enriched,
        summary: {
          materialCount: summaryAgg[0]?.count || 0,
          estimatedMaterialValue: roundMoney(summaryAgg[0]?.total || 0),
        },
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/projects/:projectId/materials
 * Body already validated by validateRequest(validateCreateMaterial).
 */
async function createMaterial(req, res, next) {
  try {
    const { projectId } = req.params;
    await findProjectOrFail(projectId);

    assertUsedNotExceedingTotal(req.body.quantity, req.body.usedQuantity ?? 0);

    const material = await Material.create({ ...req.body, projectId });

    return res.status(201).json({ success: true, data: { material } });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/projects/:projectId/materials/:materialId
 */
async function getMaterial(req, res, next) {
  try {
    const { projectId, materialId } = req.params;
    await findProjectOrFail(projectId);

    if (!isObjectId(materialId)) {
      throw new ApiError(400, 'Invalid material id.');
    }

    const material = await Material.findOne({ _id: materialId, projectId });
    if (!material) {
      throw new ApiError(404, 'Material not found in this project.');
    }

    return res.status(200).json({ success: true, data: { material } });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/projects/:projectId/materials/:materialId
 * Lookup is scoped by projectId so a material can never be edited through
 * another project's endpoint.
 */
async function updateMaterial(req, res, next) {
  try {
    const { projectId, materialId } = req.params;
    await findProjectOrFail(projectId);

    if (!isObjectId(materialId)) {
      throw new ApiError(400, 'Invalid material id.');
    }

    const material = await Material.findOne({ _id: materialId, projectId });
    if (!material) {
      throw new ApiError(404, 'Material not found in this project.');
    }

    const nextQuantity = req.body.quantity ?? material.quantity;
    const nextUsed = req.body.usedQuantity ?? material.usedQuantity ?? 0;
    assertUsedNotExceedingTotal(nextQuantity, nextUsed);

    Object.assign(material, req.body);
    await material.save();

    return res.status(200).json({ success: true, data: { material } });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/projects/:projectId/materials/:materialId
 */
async function deleteMaterial(req, res, next) {
  try {
    const { projectId, materialId } = req.params;
    await findProjectOrFail(projectId);

    if (!isObjectId(materialId)) {
      throw new ApiError(400, 'Invalid material id.');
    }

    const result = await Material.deleteOne({ _id: materialId, projectId });
    if (result.deletedCount === 0) {
      throw new ApiError(404, 'Material not found in this project.');
    }

    return res
      .status(200)
      .json({ success: true, data: { message: 'Material deleted.', id: materialId } });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listMaterials, createMaterial, getMaterial, updateMaterial, deleteMaterial };
