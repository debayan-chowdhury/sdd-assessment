const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const Employee = require('../../src/models/Employee');
const TransferRequest = require('../../src/models/TransferRequest');
const controller = require('../../src/controllers/currentHrApproval.controller');

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

async function setup(employeeTenureDaysAgo = 200) {
  const location = await Location.create({ name: 'HQ', code: 'HQ01' });
  const department = await Department.create({ name: 'Eng', code: 'ENG' });
  const role = await Role.create({ name: 'Staff', code: 'STF' });
  const hr = await Employee.create({ name: 'H', email: 'h1@example.com', locationId: location._id, departmentId: department._id, roleId: role._id });
  const otherHr = await Employee.create({ name: 'H2', email: 'h2@example.com', locationId: location._id, departmentId: department._id, roleId: role._id });
  const employee = await Employee.create({ name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: role._id });
  // Mongoose's timestamps plugin strips `createdAt` from Model.updateOne() by
  // design (immutable via normal updates), so backdating it for this fixture
  // requires the raw driver collection, bypassing that middleware.
  await mongoose.connection.collection('employees').updateOne(
    { _id: employee._id },
    { $set: { createdAt: new Date(Date.now() - employeeTenureDaysAgo * 24 * 60 * 60 * 1000) } }
  );

  const transferRequest = await TransferRequest.create({
    employeeId: employee._id,
    currentLocationId: location._id,
    currentDepartmentId: department._id,
    currentRoleId: role._id,
    newLocationId: location._id,
    newDepartmentId: department._id,
    newRoleId: role._id,
    effectiveDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    currentHrId: hr._id,
    status: 'Pending Current HR Approval',
    receivingHrId: hr._id,
  });

  return { hr, otherHr, employee, transferRequest };
}

describe('currentHrApproval.controller#decide (AC1-AC8)', () => {
  it('AC1 — accept moves status to Pending Receiving HR Approval when tenure is met', async () => {
    const { hr, transferRequest } = await setup(200);
    const res = mockRes();
    await controller.decide({ employee: { id: hr._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'accept' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].status).toBe('Pending Receiving HR Approval');
  });

  it('AC2 — accept still succeeds when tenure is under 6 months (advisory only)', async () => {
    const { hr, transferRequest } = await setup(60);
    const res = mockRes();
    await controller.decide({ employee: { id: hr._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'accept' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].status).toBe('Pending Receiving HR Approval');
  });

  it('AC3 — reject with no reason still succeeds (BRD-004 does not require one)', async () => {
    const { hr, transferRequest } = await setup(200);
    const res = mockRes();
    await controller.decide({ employee: { id: hr._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'reject' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].status).toBe('Rejected');
  });

  it('AC4 — 403 FORBIDDEN when caller is not the assigned Current HR', async () => {
    const { otherHr, transferRequest } = await setup(200);
    const res = mockRes();
    await controller.decide({ employee: { id: otherHr._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'accept' } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('AC5 — 409 INVALID_STATUS_TRANSITION when not Pending Current HR Approval', async () => {
    const { hr, transferRequest } = await setup(200);
    transferRequest.status = 'Rejected';
    await transferRequest.save();
    const res = mockRes();
    await controller.decide({ employee: { id: hr._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'accept' } }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('AC6 — 404 NOT_FOUND for a nonexistent request id', async () => {
    const { hr } = await setup(200);
    const res = mockRes();
    await controller.decide({ employee: { id: hr._id.toString() }, params: { id: new mongoose.Types.ObjectId().toString() }, body: { decision: 'accept' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('AC8 — escalates a request stuck for more than 2 days', async () => {
    const { hr, transferRequest } = await setup(200);
    transferRequest.statusEnteredAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await transferRequest.save();

    const res = mockRes();
    await controller.listPending({ employee: { id: hr._id.toString() } }, res);

    expect(res.json.mock.calls[0][0][0].escalated).toBe(true);
  });

  it('AC9 — pending list surfaces employeeTenureDays and meetsMinimumTenure', async () => {
    const { hr } = await setup(200);
    const res = mockRes();
    await controller.listPending({ employee: { id: hr._id.toString() } }, res);
    const body = res.json.mock.calls[0][0][0];
    expect(body.meetsMinimumTenure).toBe(true);
    expect(body.employeeTenureDays).toBeGreaterThanOrEqual(199);
  });
});
