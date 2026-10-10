const Admin = require('../models/Admin');
const ApiError = require('../utils/ApiError');

async function listAdmins(_req, res, next) {
  try {
    const admins = await Admin.find().sort({ createdAt: 1 });
    return res.status(200).json({
      success: true,
      data: { items: admins.map((admin) => admin.toSafeJSON()) },
    });
  } catch (error) {
    return next(error);
  }
}

async function createAdmin(req, res, next) {
  try {
    const { email, password, name, role } = req.body;

    const existing = await Admin.exists({ email });
    if (existing) {
      throw new ApiError(409, 'An admin with this email already exists.', {
        email: 'This email is already registered',
      });
    }

    const passwordHash = await Admin.hashPassword(password);
    const admin = await Admin.create({
      email,
      passwordHash,
      ...(name ? { name } : {}),
      ...(role ? { role } : {}),
    });

    return res.status(201).json({ success: true, data: { admin: admin.toSafeJSON() } });
  } catch (error) {
    return next(error);
  }
}

async function deleteAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const target = await Admin.findById(id);
    if (!target) {
      throw new ApiError(404, 'Admin not found.');
    }
    if (target.role !== 'admin') {
      throw new ApiError(403, 'Only admin accounts can be deleted by a superadmin.');
    }
    if (req.admin && req.admin._id.equals(target._id)) {
      throw new ApiError(400, 'Cannot delete your own account.');
    }
    await target.deleteOne();
    return res.status(200).json({ success: true, data: { message: 'Admin deleted.' } });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listAdmins, createAdmin, deleteAdmin };
