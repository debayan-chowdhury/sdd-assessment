const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const { validateEmployeeMapping } = require('../services/employeeMapping.service');

const PASSWORD_HASH_ROUNDS = 10;

function validationError(res, message) {
  return res.status(400).json({ error: { message, code: 'VALIDATION_ERROR' } });
}

function notFound(res, message) {
  return res.status(404).json({ error: { message, code: 'NOT_FOUND' } });
}

function toErrorResponse(res, mappingError) {
  return res.status(mappingError.status).json({
    error: { message: mappingError.message, code: mappingError.code },
  });
}

async function create(req, res) {
  const { name, email, password, locationId, departmentId, roleId, managerId = null, hrId = null } = req.body || {};

  if (!name || !email || !password || !locationId || !departmentId || !roleId) {
    return validationError(res, 'name, email, password, locationId, departmentId, and roleId are required');
  }

  const mappingError = await validateEmployeeMapping({ locationId, departmentId, roleId, managerId, hrId });
  if (mappingError) {
    return toErrorResponse(res, mappingError);
  }

  const existing = await Employee.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: { message: 'email already in use', code: 'DUPLICATE_EMAIL' } });
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

  const employee = await Employee.create({
    name, email, locationId, departmentId, roleId, managerId, hrId, passwordHash,
  });

  const response = employee.toObject();
  delete response.passwordHash;

  return res.status(201).json(response);
}

async function update(req, res) {
  const { name, email, locationId, departmentId, roleId, managerId = null, hrId = null } = req.body || {};

  if (!name || !email || !locationId || !departmentId || !roleId) {
    return validationError(res, 'name, email, locationId, departmentId, and roleId are required');
  }

  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    return notFound(res, 'Employee not found');
  }

  const mappingError = await validateEmployeeMapping({ locationId, departmentId, roleId, managerId, hrId });
  if (mappingError) {
    return toErrorResponse(res, mappingError);
  }

  const duplicate = await Employee.findOne({ email: email.toLowerCase(), _id: { $ne: employee._id } });
  if (duplicate) {
    return res.status(409).json({ error: { message: 'email already in use', code: 'DUPLICATE_EMAIL' } });
  }

  employee.name = name;
  employee.email = email;
  employee.locationId = locationId;
  employee.departmentId = departmentId;
  employee.roleId = roleId;
  employee.managerId = managerId;
  employee.hrId = hrId;
  await employee.save();
  return res.status(200).json(employee);
}

async function list(req, res) {
  const filter = {};
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }
  ['locationId', 'departmentId', 'roleId'].forEach((field) => {
    if (req.query[field] !== undefined) {
      filter[field] = req.query[field];
    }
  });
  const employees = await Employee.find(filter);
  return res.status(200).json(employees);
}

async function getById(req, res) {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    return notFound(res, 'Employee not found');
  }
  return res.status(200).json(employee);
}

async function setStatus(req, res) {
  const { isActive } = req.body || {};
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    return notFound(res, 'Employee not found');
  }
  employee.isActive = isActive;
  await employee.save();
  return res.status(200).json(employee);
}

async function remove(req, res) {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    return notFound(res, 'Employee not found');
  }

  const dependentCount = await Employee.countDocuments({
    _id: { $ne: employee._id },
    $or: [{ managerId: employee._id }, { hrId: employee._id }],
  });
  if (dependentCount > 0) {
    return res.status(409).json({
      error: { message: 'One or more Employees reference this Employee as their manager or HR contact', code: 'EMPLOYEE_HAS_DEPENDENTS' },
    });
  }

  await Employee.deleteOne({ _id: employee._id });
  return res.status(204).send();
}

module.exports = { create, update, list, getById, setStatus, remove };
