const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const Employee = require('../../src/models/Employee');
const TransferRequest = require('../../src/models/TransferRequest');
const {
  resolveReceivingHr,
  findCandidateManagers,
  validateManagerAssignment,
  computeEscalation,
  applyDueOrgUpdate,
  applyAllDueOrgUpdates,
} = require('../../src/services/transferRequestWorkflow.service');

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnect();
});

async function setupBase() {
  const location = await Location.create({ name: 'HQ', code: 'HQ01' });
  const department = await Department.create({ name: 'Eng', code: 'ENG' });
  const hrRole = await Role.create({ name: 'HR', code: 'HR1', category: 'HR' });
  const managerRole = await Role.create({ name: 'Manager', code: 'MGR1', category: 'Manager' });
  return { location, department, hrRole, managerRole };
}

describe('transferRequestWorkflow.service#resolveReceivingHr (AC6, AC7)', () => {
  it('AC6 — resolves the single active HR-category Employee at a Location+Department', async () => {
    const { location, department, hrRole } = await setupBase();
    const hr = await Employee.create({ name: 'HR', email: 'hr-e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });

    const result = await resolveReceivingHr(location._id, department._id);
    expect(result._id.toString()).toBe(hr._id.toString());
  });

  it('AC7 — returns null when no HR-category Employee exists there', async () => {
    const { location, department } = await setupBase();
    const result = await resolveReceivingHr(location._id, department._id);
    expect(result).toBeNull();
  });
});

describe('transferRequestWorkflow.service#findCandidateManagers', () => {
  it('returns active Manager-category Employees at the Location+Department, excluding given ids', async () => {
    const { location, department, managerRole } = await setupBase();
    const m1 = await Employee.create({ name: 'M1', email: 'm1@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id });
    const m2 = await Employee.create({ name: 'M2', email: 'm2@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id });

    const all = await findCandidateManagers(location._id, department._id);
    expect(all.map((e) => e._id.toString()).sort()).toEqual([m1._id.toString(), m2._id.toString()].sort());

    const excluded = await findCandidateManagers(location._id, department._id, [m1._id]);
    expect(excluded).toHaveLength(1);
    expect(excluded[0]._id.toString()).toBe(m2._id.toString());
  });
});

describe('transferRequestWorkflow.service#validateManagerAssignment (AC3)', () => {
  it('returns the manager when active, Manager-category, and in scope', async () => {
    const { location, department, managerRole } = await setupBase();
    const manager = await Employee.create({ name: 'M', email: 'm1@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id });

    const result = await validateManagerAssignment(manager._id, location._id, department._id);
    expect(result.error).toBeUndefined();
    expect(result.manager._id.toString()).toBe(manager._id.toString());
  });

  it('AC3 — returns INVALID_MANAGER_ROLE when the Employee is not Manager-category', async () => {
    const { location, department, hrRole } = await setupBase();
    const notManager = await Employee.create({ name: 'X', email: 'x1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });

    const result = await validateManagerAssignment(notManager._id, location._id, department._id);
    expect(result.error).toMatchObject({ status: 400, code: 'INVALID_MANAGER_ROLE' });
  });

  it('returns MANAGER_NOT_FOUND for a nonexistent id', async () => {
    const { location, department } = await setupBase();
    const mongoose = require('mongoose');
    const result = await validateManagerAssignment(new mongoose.Types.ObjectId(), location._id, department._id);
    expect(result.error).toMatchObject({ status: 404, code: 'MANAGER_NOT_FOUND' });
  });

  it('returns INVALID_MANAGER_ROLE when the manager is in a different Department', async () => {
    const { location, department, managerRole } = await setupBase();
    const otherDept = await Department.create({ name: 'Sales', code: 'SAL' });
    const manager = await Employee.create({ name: 'M', email: 'm1@example.com', locationId: location._id, departmentId: otherDept._id, roleId: managerRole._id });

    const result = await validateManagerAssignment(manager._id, location._id, department._id);
    expect(result.error).toMatchObject({ status: 400, code: 'INVALID_MANAGER_ROLE' });
  });
});

describe('transferRequestWorkflow.service#applyDueOrgUpdate (AC1a, AC1b)', () => {
  async function makeAcceptedRequest({ effectiveDate }) {
    const { location, department, hrRole, managerRole } = await setupBase();
    const newLocation = await Location.create({ name: 'Mumbai', code: 'BOM' });
    const staffRole = await Role.create({ name: 'Staff', code: 'STF1' });
    const manager = await Employee.create({ name: 'M', email: 'm-e1@example.com', locationId: newLocation._id, departmentId: department._id, roleId: managerRole._id });
    const hr = await Employee.create({ name: 'H', email: 'h-e1@example.com', locationId: newLocation._id, departmentId: department._id, roleId: hrRole._id });
    const employee = await Employee.create({ name: 'E', email: 'e-e1@example.com', locationId: location._id, departmentId: department._id, roleId: staffRole._id });

    const transferRequest = await TransferRequest.create({
      employeeId: employee._id,
      currentLocationId: location._id,
      currentDepartmentId: department._id,
      currentRoleId: staffRole._id,
      newLocationId: newLocation._id,
      newDepartmentId: department._id,
      newRoleId: staffRole._id,
      effectiveDate,
      status: 'Pending Receiving Manager Approval',
      receivingHrId: hr._id,
      receivingManagerId: manager._id,
    });

    return { employee, manager, hr, newLocation, transferRequest };
  }

  it('AC1a — applies the update and stamps orgDataAppliedAt once effectiveDate has passed', async () => {
    const { employee, manager, hr, newLocation, transferRequest } = await makeAcceptedRequest({
      effectiveDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    await applyDueOrgUpdate(employee._id);

    const updated = await Employee.findById(employee._id);
    expect(updated.locationId.toString()).toBe(newLocation._id.toString());
    expect(updated.managerId.toString()).toBe(manager._id.toString());
    expect(updated.hrId.toString()).toBe(hr._id.toString());

    const updatedRequest = await TransferRequest.findById(transferRequest._id);
    expect(updatedRequest.orgDataAppliedAt).toBeTruthy();
  });

  it('AC1b — leaves the Employee unchanged when effectiveDate is still in the future', async () => {
    const { employee, transferRequest } = await makeAcceptedRequest({
      effectiveDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const before = await Employee.findById(employee._id);

    await applyDueOrgUpdate(employee._id);

    const after = await Employee.findById(employee._id);
    expect(after.locationId.toString()).toBe(before.locationId.toString());
    const updatedRequest = await TransferRequest.findById(transferRequest._id);
    expect(updatedRequest.orgDataAppliedAt).toBeNull();
  });

  it('never re-applies once orgDataAppliedAt is already stamped', async () => {
    const { employee, newLocation, transferRequest } = await makeAcceptedRequest({
      effectiveDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    await applyDueOrgUpdate(employee._id);

    // Simulate the Employee moving on again after the update landed.
    const otherLocation = await Location.create({ name: 'Pune', code: 'PUN1' });
    await Employee.findByIdAndUpdate(employee._id, { locationId: otherLocation._id });

    await applyDueOrgUpdate(employee._id);

    const after = await Employee.findById(employee._id);
    expect(after.locationId.toString()).toBe(otherLocation._id.toString());
    expect(after.locationId.toString()).not.toBe(newLocation._id.toString());
    const updatedRequest = await TransferRequest.findById(transferRequest._id);
    expect(updatedRequest.orgDataAppliedAt).toBeTruthy();
  });
});

describe('transferRequestWorkflow.service#applyAllDueOrgUpdates', () => {
  async function makeAcceptedRequestFor(employeeName, effectiveDate) {
    const location = await Location.create({ name: `${employeeName}-loc`, code: `${employeeName}L1` });
    const newLocation = await Location.create({ name: `${employeeName}-newloc`, code: `${employeeName}L2` });
    const department = await Department.create({ name: `${employeeName}-dept`, code: `${employeeName}D1` });
    const staffRole = await Role.create({ name: `${employeeName}-staff`, code: `${employeeName}R1` });
    const managerRole = await Role.create({ name: `${employeeName}-mgr`, code: `${employeeName}R2`, category: 'Manager' });
    const hrRole = await Role.create({ name: `${employeeName}-hr`, code: `${employeeName}R3`, category: 'HR' });
    const manager = await Employee.create({ name: 'M', email: `${employeeName}-m@example.com`, locationId: newLocation._id, departmentId: department._id, roleId: managerRole._id });
    const hr = await Employee.create({ name: 'H', email: `${employeeName}-h@example.com`, locationId: newLocation._id, departmentId: department._id, roleId: hrRole._id });
    const employee = await Employee.create({ name: employeeName, email: `${employeeName}-e@example.com`, locationId: location._id, departmentId: department._id, roleId: staffRole._id });

    const transferRequest = await TransferRequest.create({
      employeeId: employee._id,
      currentLocationId: location._id,
      currentDepartmentId: department._id,
      currentRoleId: staffRole._id,
      newLocationId: newLocation._id,
      newDepartmentId: department._id,
      newRoleId: staffRole._id,
      effectiveDate,
      status: 'Pending Receiving Manager Approval',
      receivingHrId: hr._id,
      receivingManagerId: manager._id,
    });

    return { employee, newLocation, transferRequest };
  }

  it('applies every due request across different Employees and returns the count', async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const due1 = await makeAcceptedRequestFor('Due1', past);
    const due2 = await makeAcceptedRequestFor('Due2', past);
    const notDue = await makeAcceptedRequestFor('NotDue', future);

    const count = await applyAllDueOrgUpdates();

    expect(count).toBe(2);
    const employee1 = await Employee.findById(due1.employee._id);
    const employee2 = await Employee.findById(due2.employee._id);
    const employee3 = await Employee.findById(notDue.employee._id);
    expect(employee1.locationId.toString()).toBe(due1.newLocation._id.toString());
    expect(employee2.locationId.toString()).toBe(due2.newLocation._id.toString());
    expect(employee3.locationId.toString()).not.toBe(notDue.newLocation._id.toString());
  });

  it('returns 0 when nothing is due', async () => {
    const count = await applyAllDueOrgUpdates();
    expect(count).toBe(0);
  });
});

describe('transferRequestWorkflow.service#computeEscalation', () => {
  async function makeRequest(statusEnteredAt) {
    const { location, department, hrRole } = await setupBase();
    const employee = await Employee.create({ name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });
    return TransferRequest.create({
      employeeId: employee._id,
      currentLocationId: location._id,
      currentDepartmentId: department._id,
      currentRoleId: hrRole._id,
      newLocationId: location._id,
      newDepartmentId: department._id,
      newRoleId: hrRole._id,
      effectiveDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      receivingHrId: employee._id,
      statusEnteredAt,
    });
  }

  it('flags escalated:true once the calendar-day threshold has elapsed', async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const request = await makeRequest(threeDaysAgo);

    const result = await computeEscalation(request, 2, { businessDaysOnly: false });

    expect(result.escalated).toBe(true);
    expect(result.escalatedAt).toBeTruthy();
  });

  it('does not flag before the threshold has elapsed', async () => {
    const request = await makeRequest(new Date());
    const result = await computeEscalation(request, 2, { businessDaysOnly: false });
    expect(result.escalated).toBe(false);
  });

  it('honors a business-day-only threshold', async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const request = await makeRequest(eightDaysAgo);
    const result = await computeEscalation(request, 5, { businessDaysOnly: true });
    expect(result.escalated).toBe(true);
  });
});
