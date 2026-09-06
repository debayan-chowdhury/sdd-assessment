const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const Department = require('../models/Department');
const Location = require('../models/Location');
const { getEmployeeJwtSecret } = require('../config/employeeAuth');
const { applyDueOrgUpdate } = require('../services/transferRequestWorkflow.service');

const PASSWORD_HASH_ROUNDS = 10;

async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      error: { message: 'email and password are required', code: 'VALIDATION_ERROR' },
    });
  }

  const employee = await Employee.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!employee) {
    return res.status(401).json({ error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' } });
  }

  const matches = await bcrypt.compare(password, employee.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' } });
  }

  if (!employee.isActive) {
    return res.status(403).json({ error: { message: 'Account is inactive', code: 'ACCOUNT_INACTIVE' } });
  }

  await applyDueOrgUpdate(employee._id);
  const current = await Employee.findById(employee._id);

  const [role, manager, hr] = await Promise.all([
    Role.findById(current.roleId),
    current.managerId ? Employee.findById(current.managerId) : null,
    current.hrId ? Employee.findById(current.hrId) : null,
  ]);
  // No `expiresIn` — BRD-001 explicitly decides "no session timeout or automatic logout".
  const token = jwt.sign({ sub: employee._id.toString() }, getEmployeeJwtSecret());

  return res.status(200).json({
    token,
    employee: {
      id: current._id,
      name: current.name,
      email: current.email,
      locationId: current.locationId,
      departmentId: current.departmentId,
      roleId: current.roleId,
      roleCategory: role ? role.category : null,
      managerId: current.managerId,
      managerName: manager ? manager.name : null,
      hrId: current.hrId,
      hrName: hr ? hr.name : null,
      mustChangePassword: current.mustChangePassword,
    },
  });
}

async function profile(req, res) {
  const employee = await Employee.findById(req.employee.id);

  const [role, department, location, manager, hr] = await Promise.all([
    Role.findById(employee.roleId),
    Department.findById(employee.departmentId),
    Location.findById(employee.locationId),
    employee.managerId ? Employee.findById(employee.managerId) : null,
    employee.hrId ? Employee.findById(employee.hrId) : null,
  ]);

  return res.status(200).json({
    id: employee._id,
    name: employee.name,
    email: employee.email,
    locationId: employee.locationId,
    locationName: location ? location.name : null,
    departmentId: employee.departmentId,
    departmentName: department ? department.name : null,
    roleId: employee.roleId,
    roleName: role ? role.name : null,
    roleCategory: role ? role.category : null,
    managerId: employee.managerId,
    managerName: manager ? manager.name : null,
    hrId: employee.hrId,
    hrName: hr ? hr.name : null,
    mustChangePassword: employee.mustChangePassword,
  });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: { message: 'currentPassword and newPassword are required', code: 'VALIDATION_ERROR' },
    });
  }

  const employee = await Employee.findById(req.employee.id).select('+passwordHash');
  const matches = await bcrypt.compare(currentPassword, employee.passwordHash);
  if (!matches) {
    return res.status(400).json({
      error: { message: 'currentPassword is incorrect', code: 'INVALID_CURRENT_PASSWORD' },
    });
  }

  employee.passwordHash = await bcrypt.hash(newPassword, PASSWORD_HASH_ROUNDS);
  employee.mustChangePassword = false;
  await employee.save();

  return res.status(200).json({ message: 'Password updated' });
}

module.exports = { login, profile, changePassword };
