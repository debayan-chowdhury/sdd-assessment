const mongoose = require('mongoose');
const Department = require('../models/Department');
const DepartmentRole = require('../models/DepartmentRole');
const Role = require('../models/Role');
const LocationDepartment = require('../models/LocationDepartment');

function validationError(res, message) {
  return res.status(400).json({ error: { message, code: 'VALIDATION_ERROR' } });
}

function notFound(res, message) {
  return res.status(404).json({ error: { message, code: 'NOT_FOUND' } });
}

async function create(req, res) {
  const { name, code } = req.body || {};
  if (!name || !code) {
    return validationError(res, 'name and code are required');
  }

  const existing = await Department.findOne({ code });
  if (existing) {
    return res.status(409).json({ error: { message: 'code already in use', code: 'DUPLICATE_CODE' } });
  }

  const department = await Department.create({ name, code });
  return res.status(201).json(department);
}

async function list(req, res) {
  const filter = {};
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }
  const departments = await Department.find(filter);
  return res.status(200).json(departments);
}

async function getById(req, res) {
  const department = await Department.findById(req.params.id);
  if (!department) {
    return notFound(res, 'Department not found');
  }
  return res.status(200).json(department);
}

async function update(req, res) {
  const { name, code } = req.body || {};
  if (!name || !code) {
    return validationError(res, 'name and code are required');
  }

  const department = await Department.findById(req.params.id);
  if (!department) {
    return notFound(res, 'Department not found');
  }

  const duplicate = await Department.findOne({ code, _id: { $ne: department._id } });
  if (duplicate) {
    return res.status(409).json({ error: { message: 'code already in use', code: 'DUPLICATE_CODE' } });
  }

  department.name = name;
  department.code = code;
  await department.save();
  return res.status(200).json(department);
}

async function setStatus(req, res) {
  const { isActive } = req.body || {};
  const department = await Department.findById(req.params.id);
  if (!department) {
    return notFound(res, 'Department not found');
  }

  if (isActive === false) {
    const activeEmployeeCount = await mongoose.connection
      .collection('employees')
      .countDocuments({ departmentId: department._id, isActive: true });
    if (activeEmployeeCount > 0) {
      return res.status(409).json({
        error: { message: 'Department has active employees mapped to it', code: 'DEPARTMENT_HAS_ACTIVE_EMPLOYEES' },
      });
    }
  }

  department.isActive = isActive;
  await department.save();
  return res.status(200).json(department);
}

async function remove(req, res) {
  const department = await Department.findById(req.params.id);
  if (!department) {
    return notFound(res, 'Department not found');
  }

  const employeeCount = await mongoose.connection
    .collection('employees')
    .countDocuments({ departmentId: department._id });
  if (employeeCount > 0) {
    return res.status(409).json({
      error: { message: 'One or more Employees are mapped to this Department', code: 'DEPARTMENT_HAS_EMPLOYEES' },
    });
  }

  await LocationDepartment.deleteMany({ departmentId: department._id });
  await DepartmentRole.deleteMany({ departmentId: department._id });
  await Department.deleteOne({ _id: department._id });
  return res.status(204).send();
}

async function mapRole(req, res) {
  const { roleId } = req.body || {};
  const department = await Department.findById(req.params.id);
  if (!department) {
    return notFound(res, 'Department not found');
  }
  const role = await Role.findById(roleId);
  if (!role) {
    return notFound(res, 'Role not found');
  }

  const existing = await DepartmentRole.findOne({ departmentId: department._id, roleId: role._id });
  if (existing) {
    return res.status(409).json({
      error: { message: 'This Department and Role are already mapped', code: 'MAPPING_ALREADY_EXISTS' },
    });
  }

  const mapping = await DepartmentRole.create({ departmentId: department._id, roleId: role._id });
  return res.status(201).json({ departmentId: mapping.departmentId, roleId: mapping.roleId });
}

async function unmapRole(req, res) {
  const mapping = await DepartmentRole.findOneAndDelete({
    departmentId: req.params.id,
    roleId: req.params.roleId,
  });
  if (!mapping) {
    return notFound(res, 'Mapping not found');
  }
  return res.status(204).send();
}

async function listRoles(req, res) {
  const department = await Department.findById(req.params.id);
  if (!department) {
    return notFound(res, 'Department not found');
  }
  const mappings = await DepartmentRole.find({ departmentId: department._id });
  const roles = await Role.find({ _id: { $in: mappings.map((m) => m.roleId) } });
  return res.status(200).json(roles);
}

module.exports = {
  create,
  list,
  getById,
  update,
  setStatus,
  remove,
  mapRole,
  unmapRole,
  listRoles,
};
