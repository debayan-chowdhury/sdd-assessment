const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const { getEmployeeJwtSecret } = require('../config/employeeAuth');
const { applyDueOrgUpdate } = require('../services/transferRequestWorkflow.service');

async function employeeAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: { message: 'Missing or malformed Authorization header', code: 'UNAUTHORIZED' },
    });
  }

  let payload;
  try {
    payload = jwt.verify(token, getEmployeeJwtSecret());
  } catch (err) {
    return res.status(401).json({ error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' } });
  }

  await applyDueOrgUpdate(payload.sub);

  const employee = await Employee.findById(payload.sub);
  if (!employee) {
    return res.status(401).json({ error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' } });
  }

  const role = await Role.findById(employee.roleId);
  req.employee = { id: employee._id.toString(), roleCategory: role ? role.category : null };
  return next();
}

module.exports = employeeAuth;
