const TransferRequest = require('../models/TransferRequest');
const Employee = require('../models/Employee');
const Location = require('../models/Location');
const Department = require('../models/Department');
const Role = require('../models/Role');
const DepartmentRole = require('../models/DepartmentRole');
const { resolveReceivingHr, computeEscalation } = require('../services/transferRequestWorkflow.service');

const MIN_NOTICE_DAYS = 30;
const ESCALATION_THRESHOLD_DAYS = 2;

const NON_TERMINAL_STATUSES = { $nin: ['Rejected', 'Completed'] };

function validationError(res, message) {
  return res.status(400).json({ error: { message, code: 'VALIDATION_ERROR' } });
}

async function create(req, res) {
  const { newLocationId, newDepartmentId, newRoleId, effectiveDate, reason } = req.body || {};

  if (!newLocationId || !newDepartmentId || !newRoleId || !effectiveDate) {
    return validationError(res, 'newLocationId, newDepartmentId, newRoleId, and effectiveDate are required');
  }

  const employee = await Employee.findById(req.employee.id);

  if (
    String(newLocationId) === String(employee.locationId) &&
    String(newDepartmentId) === String(employee.departmentId) &&
    String(newRoleId) === String(employee.roleId)
  ) {
    return res.status(400).json({
      error: { message: 'You are already in this location, department, and role. Please change at least one of them to submit a transfer request.', code: 'NO_CHANGE_REQUESTED' },
    });
  }

  const activeRequest = await TransferRequest.findOne({ employeeId: employee._id, status: NON_TERMINAL_STATUSES });
  if (activeRequest) {
    return res.status(409).json({ error: { message: 'An active Internal Transfer request already exists', code: 'ACTIVE_REQUEST_EXISTS' } });
  }

  const minEffectiveDate = new Date();
  minEffectiveDate.setDate(minEffectiveDate.getDate() + MIN_NOTICE_DAYS);
  if (new Date(effectiveDate) < minEffectiveDate) {
    return res.status(400).json({ error: { message: `effectiveDate must be at least ${MIN_NOTICE_DAYS} days from today`, code: 'EFFECTIVE_DATE_TOO_SOON' } });
  }

  const [location, department, role] = await Promise.all([
    Location.findOne({ _id: newLocationId, isActive: true }),
    Department.findOne({ _id: newDepartmentId, isActive: true }),
    Role.findOne({ _id: newRoleId, isActive: true }),
  ]);
  if (!location || !department || !role) {
    return res.status(404).json({ error: { message: 'newLocationId, newDepartmentId, or newRoleId does not reference an existing active record', code: 'NOT_FOUND' } });
  }

  if (role.category !== null) {
    return res.status(400).json({
      error: { message: 'newRoleId must be a regular role — Manager, HR, IT, Payroll, and Facilities roles cannot be selected for a transfer request', code: 'ROLE_CATEGORY_NOT_ALLOWED' },
    });
  }

  // Auto-enable: rather than rejecting a transfer to a Role not yet mapped to
  // the target Department, create the mapping on the fly so the request can
  // proceed — an Admin no longer has to pre-map every Role/Department
  // combination before an Employee can transfer into it.
  await DepartmentRole.findOneAndUpdate(
    { departmentId: newDepartmentId, roleId: newRoleId },
    { departmentId: newDepartmentId, roleId: newRoleId },
    { upsert: true }
  );

  const receivingHr = await resolveReceivingHr(newLocationId, newDepartmentId);
  if (!receivingHr) {
    return res.status(404).json({ error: { message: 'No active HR-category Employee exists at newLocationId+newDepartmentId', code: 'NO_RECEIVING_HR' } });
  }

  const transferRequest = await TransferRequest.create({
    employeeId: employee._id,
    currentLocationId: employee.locationId,
    currentDepartmentId: employee.departmentId,
    currentRoleId: employee.roleId,
    newLocationId,
    newDepartmentId,
    newRoleId,
    effectiveDate,
    reason: reason || null,
    currentManagerId: employee.managerId,
    currentHrId: employee.hrId,
    receivingHrId: receivingHr._id,
  });

  return res.status(201).json(transferRequest);
}

async function withApproverNames(transferRequest) {
  const [manager, hr, receivingManager, receivingHr] = await Promise.all([
    transferRequest.currentManagerId ? Employee.findById(transferRequest.currentManagerId) : null,
    transferRequest.currentHrId ? Employee.findById(transferRequest.currentHrId) : null,
    transferRequest.receivingManagerId ? Employee.findById(transferRequest.receivingManagerId) : null,
    transferRequest.receivingHrId ? Employee.findById(transferRequest.receivingHrId) : null,
  ]);
  const plain = transferRequest.toJSON();
  plain.currentManagerName = manager ? manager.name : null;
  plain.currentHrName = hr ? hr.name : null;
  plain.receivingManagerName = receivingManager ? receivingManager.name : null;
  plain.receivingHrName = receivingHr ? receivingHr.name : null;
  return plain;
}

async function listMine(req, res) {
  const requests = await TransferRequest.find({ employeeId: req.employee.id }).sort({ createdAt: -1 });
  await Promise.all(requests.map((r) => computeEscalation(r, ESCALATION_THRESHOLD_DAYS)));
  const withNames = await Promise.all(requests.map(withApproverNames));
  return res.status(200).json(withNames);
}

async function getById(req, res) {
  const transferRequest = await TransferRequest.findById(req.params.id);
  if (!transferRequest) {
    return res.status(404).json({ error: { message: 'TransferRequest not found', code: 'NOT_FOUND' } });
  }
  if (String(transferRequest.employeeId) !== String(req.employee.id)) {
    return res.status(403).json({ error: { message: 'This TransferRequest does not belong to you', code: 'FORBIDDEN' } });
  }
  await computeEscalation(transferRequest, ESCALATION_THRESHOLD_DAYS);
  return res.status(200).json(transferRequest);
}

module.exports = { create, listMine, getById };
