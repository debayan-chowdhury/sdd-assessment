const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const Employee = require('../../src/models/Employee');
const TransferRequest = require('../../src/models/TransferRequest');
const controller = require('../../src/controllers/currentManagerApproval.controller');

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

async function setup() {
  const location = await Location.create({ name: 'HQ', code: 'HQ01' });
  const department = await Department.create({ name: 'Eng', code: 'ENG' });
  const role = await Role.create({ name: 'Staff', code: 'STF' });
  const manager = await Employee.create({ name: 'M', email: 'm1@example.com', locationId: location._id, departmentId: department._id, roleId: role._id });
  const otherManager = await Employee.create({ name: 'M2', email: 'm2@example.com', locationId: location._id, departmentId: department._id, roleId: role._id });
  const employee = await Employee.create({ name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: role._id });

  const transferRequest = await TransferRequest.create({
    employeeId: employee._id,
    currentLocationId: location._id,
    currentDepartmentId: department._id,
    currentRoleId: role._id,
    newLocationId: location._id,
    newDepartmentId: department._id,
    newRoleId: role._id,
    effectiveDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    currentManagerId: manager._id,
    receivingHrId: employee._id,
  });

  return { manager, otherManager, transferRequest };
}

describe('currentManagerApproval.controller#decide (AC1-AC8)', () => {
  it('AC1 — accept moves status to Pending Current HR Approval', async () => {
    const { manager, transferRequest } = await setup();
    const res = mockRes();
    await controller.decide({ employee: { id: manager._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'accept' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].status).toBe('Pending Current HR Approval');
  });

  it('AC2 — reject with a reason sets status Rejected and rejectionReason', async () => {
    const { manager, transferRequest } = await setup();
    const res = mockRes();
    await controller.decide({ employee: { id: manager._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'reject', reason: 'Team continuity' } }, res);
    expect(res.json.mock.calls[0][0].status).toBe('Rejected');
    expect(res.json.mock.calls[0][0].rejectionReason).toBe('Team continuity');
  });

  it('AC3 — reject without a reason returns 400 REASON_REQUIRED', async () => {
    const { manager, transferRequest } = await setup();
    const res = mockRes();
    await controller.decide({ employee: { id: manager._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'reject' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'REASON_REQUIRED' } });
  });

  it('AC4 — 403 FORBIDDEN when caller is not the assigned Current Manager', async () => {
    const { otherManager, transferRequest } = await setup();
    const res = mockRes();
    await controller.decide({ employee: { id: otherManager._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'accept' } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('AC5 — 409 INVALID_STATUS_TRANSITION when not Pending Current Manager Approval', async () => {
    const { manager, transferRequest } = await setup();
    transferRequest.status = 'Rejected';
    await transferRequest.save();
    const res = mockRes();
    await controller.decide({ employee: { id: manager._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'accept' } }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('AC6 — 404 NOT_FOUND for a nonexistent request id', async () => {
    const { manager } = await setup();
    const res = mockRes();
    await controller.decide({ employee: { id: manager._id.toString() }, params: { id: new mongoose.Types.ObjectId().toString() }, body: { decision: 'accept' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('AC8 — escalates a request stuck for more than 2 days', async () => {
    const { manager, transferRequest } = await setup();
    transferRequest.statusEnteredAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await transferRequest.save();

    const res = mockRes();
    await controller.listPending({ employee: { id: manager._id.toString() } }, res);

    const returned = res.json.mock.calls[0][0][0];
    expect(returned.escalated).toBe(true);
    expect(returned.status).toBe('Pending Current Manager Approval');
  });

  it('AC9 — pending list scoped correctly to the assigned manager and correct status', async () => {
    const { manager, otherManager, transferRequest } = await setup();
    const res = mockRes();
    await controller.listPending({ employee: { id: manager._id.toString() } }, res);
    expect(res.json.mock.calls[0][0]).toHaveLength(1);

    const otherRes = mockRes();
    await controller.listPending({ employee: { id: otherManager._id.toString() } }, otherRes);
    expect(otherRes.json.mock.calls[0][0]).toHaveLength(0);
  });
});
