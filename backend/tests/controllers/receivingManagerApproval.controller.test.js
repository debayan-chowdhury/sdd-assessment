const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const Employee = require('../../src/models/Employee');
const TransferRequest = require('../../src/models/TransferRequest');
const controller = require('../../src/controllers/receivingManagerApproval.controller');
const transferRequestController = require('../../src/controllers/transferRequest.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnect();
});

async function setup({ managerCount = 2 } = {}) {
  const location = await Location.create({ name: 'Mumbai', code: 'BOM' });
  const department = await Department.create({ name: 'Sales', code: 'SAL' });
  const managerRole = await Role.create({ name: 'Manager', code: 'MGR', category: 'Manager' });
  const hrRole = await Role.create({ name: 'HR', code: 'HR1', category: 'HR' });
  const staffRole = await Role.create({ name: 'Staff', code: 'STF' });

  const managers = [];
  for (let i = 0; i < managerCount; i += 1) {
    managers.push(await Employee.create({ name: `M${i}`, email: `m${i}@example.com`, locationId: location._id, departmentId: department._id, roleId: managerRole._id }));
  }
  const receivingHr = await Employee.create({ name: 'HR', email: 'hr1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });
  const employee = await Employee.create({ name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: staffRole._id });

  const transferRequest = await TransferRequest.create({
    employeeId: employee._id,
    currentLocationId: location._id,
    currentDepartmentId: department._id,
    currentRoleId: staffRole._id,
    newLocationId: location._id,
    newDepartmentId: department._id,
    newRoleId: staffRole._id,
    effectiveDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    receivingHrId: receivingHr._id,
    receivingManagerId: managers[0]._id,
    status: 'Pending Receiving Manager Approval',
  });

  return { location, department, managers, receivingHr, employee, transferRequest };
}

describe('receivingManagerApproval.controller#decide (AC1-AC8)', () => {
  it('AC1 — accept moves status to Pending Fulfillment Trigger', async () => {
    const { managers, transferRequest } = await setup();
    const res = mockRes();
    await controller.decide({ employee: { id: managers[0]._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'accept' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].status).toBe('Pending Fulfillment Trigger');
  });

  it('AC2 — reject with a remaining candidate moves to Pending Receiving HR Reassignment', async () => {
    const { managers, transferRequest } = await setup({ managerCount: 2 });
    const res = mockRes();
    await controller.decide({ employee: { id: managers[0]._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'reject', reasonCode: 'NO_HEADCOUNT' } }, res);
    expect(res.json.mock.calls[0][0].status).toBe('Pending Receiving HR Reassignment');
  });

  it('AC3 — reject exhausting all multi-manager candidates goes to Hold', async () => {
    const { managers, transferRequest } = await setup({ managerCount: 2 });
    transferRequest.rejectedManagerIds = [managers[1]._id];
    transferRequest.receivingManagerId = managers[0]._id;
    await transferRequest.save();

    const res = mockRes();
    await controller.decide({ employee: { id: managers[0]._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'reject', reasonCode: 'TIMING_CONFLICT' } }, res);

    expect(res.json.mock.calls[0][0].status).toBe('Hold');
    expect(res.json.mock.calls[0][0].holdReason).toContain('TIMING_CONFLICT');
  });

  it('AC4 — single-manager reject goes straight to Hold', async () => {
    const { managers, transferRequest } = await setup({ managerCount: 1 });
    const res = mockRes();
    await controller.decide({ employee: { id: managers[0]._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'reject', reasonCode: 'ROLE_SKILL_MISMATCH' } }, res);
    expect(res.json.mock.calls[0][0].status).toBe('Hold');
  });

  it('AC5 — 400 VALIDATION_ERROR for a missing/invalid reasonCode', async () => {
    const { managers, transferRequest } = await setup();
    const res = mockRes();
    await controller.decide({ employee: { id: managers[0]._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'reject' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('AC6 — 403 FORBIDDEN when caller is not the assigned Receiving Manager', async () => {
    const { managers, transferRequest } = await setup();
    const res = mockRes();
    await controller.decide({ employee: { id: managers[1]._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'accept' } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('AC7 — 409 INVALID_STATUS_TRANSITION on wrong status', async () => {
    const { managers, transferRequest } = await setup();
    transferRequest.status = 'Rejected';
    await transferRequest.save();
    const res = mockRes();
    await controller.decide({ employee: { id: managers[0]._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'accept' } }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('AC8 — 404 NOT_FOUND for a nonexistent id', async () => {
    const { managers } = await setup();
    const res = mockRes();
    await controller.decide({ employee: { id: managers[0]._id.toString() }, params: { id: new mongoose.Types.ObjectId().toString() }, body: { decision: 'accept' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('receivingManagerApproval.controller#listPending (AC10-AC11)', () => {
  it('AC10 — escalates a request stuck for more than 2 days', async () => {
    const { managers, transferRequest } = await setup();
    transferRequest.statusEnteredAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await transferRequest.save();
    const res = mockRes();
    await controller.listPending({ employee: { id: managers[0]._id.toString() } }, res);
    expect(res.json.mock.calls[0][0][0].escalated).toBe(true);
  });

  it('AC11 — scoped correctly to the assigned manager', async () => {
    const { managers } = await setup();
    const res = mockRes();
    await controller.listPending({ employee: { id: managers[0]._id.toString() } }, res);
    expect(res.json.mock.calls[0][0]).toHaveLength(1);
    const otherRes = mockRes();
    await controller.listPending({ employee: { id: managers[1]._id.toString() } }, otherRes);
    expect(otherRes.json.mock.calls[0][0]).toHaveLength(0);
  });
});

describe('receivingManagerApproval — Hold visibility (AC12)', () => {
  it('AC12 — a Hold request is visible to the employee via GET .../:id with holdReason', async () => {
    const { managers, employee, transferRequest } = await setup({ managerCount: 1 });
    const res = mockRes();
    await controller.decide({ employee: { id: managers[0]._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'reject', reasonCode: 'NO_HEADCOUNT' } }, res);

    const viewRes = mockRes();
    await transferRequestController.getById({ employee: { id: employee._id.toString() }, params: { id: transferRequest._id.toString() } }, viewRes);

    expect(viewRes.json.mock.calls[0][0].status).toBe('Hold');
    expect(viewRes.json.mock.calls[0][0].holdReason).toContain('NO_HEADCOUNT');
  });
});
