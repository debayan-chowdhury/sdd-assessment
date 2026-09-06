const Employee = require('../models/Employee');
const Role = require('../models/Role');
const TransferRequest = require('../models/TransferRequest');

async function resolveReceivingHr(locationId, departmentId) {
  const hrRoles = await Role.find({ category: 'HR' }).select('_id');
  const hrRoleIds = hrRoles.map((r) => r._id);
  return Employee.findOne({
    locationId, departmentId, isActive: true, roleId: { $in: hrRoleIds },
  });
}

async function findCandidateManagers(locationId, departmentId, excludeIds = []) {
  const managerRoles = await Role.find({ category: 'Manager' }).select('_id');
  const managerRoleIds = managerRoles.map((r) => r._id);
  return Employee.find({
    locationId,
    departmentId,
    isActive: true,
    roleId: { $in: managerRoleIds },
    _id: { $nin: excludeIds },
  });
}

async function validateManagerAssignment(managerId, locationId, departmentId) {
  const manager = await Employee.findById(managerId);
  if (!manager) {
    return { error: { status: 404, code: 'MANAGER_NOT_FOUND', message: 'assignedManagerId does not reference an existing Employee' } };
  }
  const role = await Role.findById(manager.roleId);
  const sameScope = String(manager.locationId) === String(locationId) && String(manager.departmentId) === String(departmentId);
  if (!manager.isActive || !role || role.category !== 'Manager' || !sameScope) {
    return { error: { status: 400, code: 'INVALID_MANAGER_ROLE', message: 'assignedManagerId does not hold a Manager-category Role at the given Location+Department' } };
  }
  return { manager };
}

function countBusinessDays(from, to) {
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  let count = 0;
  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
  }
  return count;
}

async function computeEscalation(request, thresholdDays, { businessDaysOnly = false } = {}) {
  if (request.escalated) {
    return request;
  }
  const now = new Date();
  const elapsedDays = businessDaysOnly
    ? countBusinessDays(request.statusEnteredAt, now)
    : (now.getTime() - request.statusEnteredAt.getTime()) / (1000 * 60 * 60 * 24);

  if (elapsedDays >= thresholdDays) {
    request.escalated = true;
    request.escalatedAt = now;
    await request.save();
  }
  return request;
}

async function applyOrgUpdateForRequest(pending) {
  await Employee.findByIdAndUpdate(pending.employeeId, {
    locationId: pending.newLocationId,
    departmentId: pending.newDepartmentId,
    roleId: pending.newRoleId,
    managerId: pending.receivingManagerId,
    hrId: pending.receivingHrId,
  });
  pending.orgDataAppliedAt = new Date();
  await pending.save();
}

// Applies a due, already-accepted transfer's Location/Department/Role/Manager/HR
// to the Employee record, deferred until `effectiveDate` rather than at
// Receiving HR's gate-accept moment (see receivingHrGatekeeping.controller.js's
// gateDecision). Called lazily from employeeAuth.middleware.js on every
// authenticated request for that Employee, and from login — a fast-path
// safety net independent of dueOrgUpdates.job.js's scheduled sweep, so the
// update still lands immediately if that Employee happens to authenticate
// before the next scheduled run.
async function applyDueOrgUpdate(employeeId) {
  const pending = await TransferRequest.findOne({
    employeeId,
    receivingManagerId: { $ne: null },
    orgDataAppliedAt: null,
    effectiveDate: { $lte: new Date() },
  });
  if (!pending) return;
  await applyOrgUpdateForRequest(pending);
}

// The scheduled counterpart to applyDueOrgUpdate — sweeps every Employee's
// due transfer, not just one, so the org update lands close to the actual
// effectiveDate even if the affected Employee never logs in around that
// time (see jobs/dueOrgUpdates.job.js, which calls this on a timer).
async function applyAllDueOrgUpdates() {
  const dueRequests = await TransferRequest.find({
    receivingManagerId: { $ne: null },
    orgDataAppliedAt: null,
    effectiveDate: { $lte: new Date() },
  });
  for (const pending of dueRequests) {
    // eslint-disable-next-line no-await-in-loop
    await applyOrgUpdateForRequest(pending);
  }
  return dueRequests.length;
}

module.exports = {
  resolveReceivingHr,
  findCandidateManagers,
  validateManagerAssignment,
  computeEscalation,
  applyDueOrgUpdate,
  applyAllDueOrgUpdates,
};
