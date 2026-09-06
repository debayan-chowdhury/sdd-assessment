const mongoose = require('mongoose');
const Role = require('../models/Role');
const DepartmentRole = require('../models/DepartmentRole');

const VALID_CATEGORIES = ['HR', 'Manager', 'Payroll', 'IT', 'Facilities'];

function validationError(res, message) {
  return res.status(400).json({ error: { message, code: 'VALIDATION_ERROR' } });
}

function notFound(res, message) {
  return res.status(404).json({ error: { message, code: 'NOT_FOUND' } });
}

function isValidCategory(category) {
  return category === null || category === undefined || VALID_CATEGORIES.includes(category);
}

async function create(req, res) {
  const { name, code, category = null } = req.body || {};
  if (!name || !code) {
    return validationError(res, 'name and code are required');
  }
  if (!isValidCategory(category)) {
    return res.status(400).json({ error: { message: 'category must be HR, Manager, Payroll, IT, Facilities, or omitted', code: 'INVALID_CATEGORY' } });
  }

  const existing = await Role.findOne({ code });
  if (existing) {
    return res.status(409).json({ error: { message: 'code already in use', code: 'DUPLICATE_CODE' } });
  }

  const role = await Role.create({ name, code, category: category ?? null });
  return res.status(201).json(role);
}

async function list(req, res) {
  const filter = {};
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }
  if (req.query.category !== undefined) {
    filter.category = req.query.category;
  }
  const roles = await Role.find(filter);
  return res.status(200).json(roles);
}

async function getById(req, res) {
  const role = await Role.findById(req.params.id);
  if (!role) {
    return notFound(res, 'Role not found');
  }
  return res.status(200).json(role);
}

async function update(req, res) {
  const { name, code, category = null } = req.body || {};
  if (!name || !code) {
    return validationError(res, 'name and code are required');
  }
  if (!isValidCategory(category)) {
    return res.status(400).json({ error: { message: 'category must be HR, Manager, Payroll, IT, Facilities, or omitted', code: 'INVALID_CATEGORY' } });
  }

  const role = await Role.findById(req.params.id);
  if (!role) {
    return notFound(res, 'Role not found');
  }

  const duplicate = await Role.findOne({ code, _id: { $ne: role._id } });
  if (duplicate) {
    return res.status(409).json({ error: { message: 'code already in use', code: 'DUPLICATE_CODE' } });
  }

  role.name = name;
  role.code = code;
  role.category = category ?? null;
  await role.save();
  return res.status(200).json(role);
}

async function setStatus(req, res) {
  const { isActive } = req.body || {};
  const role = await Role.findById(req.params.id);
  if (!role) {
    return notFound(res, 'Role not found');
  }

  if (isActive === false) {
    const activeEmployeeCount = await mongoose.connection
      .collection('employees')
      .countDocuments({ roleId: role._id, isActive: true });
    if (activeEmployeeCount > 0) {
      return res.status(409).json({
        error: { message: 'Role has active employees holding it', code: 'ROLE_HAS_ACTIVE_EMPLOYEES' },
      });
    }
  }

  role.isActive = isActive;
  await role.save();
  return res.status(200).json(role);
}

async function remove(req, res) {
  const role = await Role.findById(req.params.id);
  if (!role) {
    return notFound(res, 'Role not found');
  }

  const employeeCount = await mongoose.connection
    .collection('employees')
    .countDocuments({ roleId: role._id });
  if (employeeCount > 0) {
    return res.status(409).json({
      error: { message: 'One or more Employees hold this Role', code: 'ROLE_HAS_EMPLOYEES' },
    });
  }

  await DepartmentRole.deleteMany({ roleId: role._id });
  await Role.deleteOne({ _id: role._id });
  return res.status(204).send();
}

module.exports = { create, list, getById, update, setStatus, remove };
