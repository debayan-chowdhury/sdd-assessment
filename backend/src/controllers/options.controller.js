const Location = require('../models/Location');
const Department = require('../models/Department');
const Role = require('../models/Role');
const Employee = require('../models/Employee');

function validationError(res, message) {
  return res.status(400).json({ error: { message, code: 'VALIDATION_ERROR' } });
}

async function listLocations(req, res) {
  const locations = await Location.find({ isActive: true }).sort({ name: 1 });
  return res.status(200).json(locations);
}

async function listDepartments(req, res) {
  const { locationId } = req.query;

  // locationId is optional: omitted, this returns every active Department
  // unfiltered — used for id->name display resolution (e.g. rendering a
  // TransferRequest's target department in an approvals queue), where the
  // qualifying-staffing filter below (only meaningful for the "can a new
  // transfer land here" form-option use case) would wrongly hide a
  // department a request already references.
  if (!locationId) {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    return res.status(200).json(departments);
  }

  const [hrRoleIds, managerRoleIds] = await Promise.all([
    Role.find({ category: 'HR' }).distinct('_id'),
    Role.find({ category: 'Manager' }).distinct('_id'),
  ]);

  const [hrDeptIds, managerDeptIds] = await Promise.all([
    Employee.find({ locationId, isActive: true, roleId: { $in: hrRoleIds } }).distinct('departmentId'),
    Employee.find({ locationId, isActive: true, roleId: { $in: managerRoleIds } }).distinct('departmentId'),
  ]);

  const managerDeptIdSet = new Set(managerDeptIds.map(String));
  const qualifyingDeptIds = hrDeptIds.filter((id) => managerDeptIdSet.has(String(id)));

  const departments = await Department.find({ _id: { $in: qualifyingDeptIds }, isActive: true }).sort({ name: 1 });
  return res.status(200).json(departments);
}

// category: null only — Manager/HR/IT/Payroll/Facilities are functional
// categories assigned by an Admin, not roles an Employee can transfer into
// via self-service (see transferRequest.controller.js#create's matching check).
async function listRoles(req, res) {
  const roles = await Role.find({ isActive: true, category: null }).sort({ name: 1 });
  return res.status(200).json(roles);
}

// Employee-token-accessible, bulk, id-bounded name resolution — deliberately
// not a full roster listing (that stays admin-only at GET /employees).
// Approval-queue screens across the Internal Transfer journey need to
// display the requesting employee's name from a TransferRequest's
// employeeId, and no such endpoint existed in this journey's original
// contract (same class of gap as /options/locations|departments|roles,
// resolved the same way).
async function listEmployeesByIds(req, res) {
  const { ids } = req.query;
  if (!ids) {
    return validationError(res, 'ids is required');
  }
  const idList = String(ids)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  if (idList.length === 0) {
    return validationError(res, 'ids is required');
  }

  const employees = await Employee.find({ _id: { $in: idList } }).select('_id name');
  return res.status(200).json(employees);
}

// Employee-token-accessible list of candidate Receiving Managers at a given
// Location+Department, for the manager-selection picker used by Receiving
// HR's accept/reassign/reopen-hold actions. Mirrors
// transferRequestWorkflow.service#findCandidateManagers (also used
// server-side to validate a submitted assignedManagerId) so the picker's
// options and the accept endpoint's validation agree.
async function listManagers(req, res) {
  const { locationId, departmentId } = req.query;
  if (!locationId || !departmentId) {
    return validationError(res, 'locationId and departmentId are required');
  }

  const managerRoleIds = await Role.find({ category: 'Manager' }).distinct('_id');
  const managers = await Employee.find({
    locationId,
    departmentId,
    isActive: true,
    roleId: { $in: managerRoleIds },
  }).select('_id name');
  return res.status(200).json(managers);
}

module.exports = {
  listLocations,
  listDepartments,
  listRoles,
  listEmployeesByIds,
  listManagers,
};
