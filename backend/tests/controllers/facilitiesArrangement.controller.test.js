const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const Employee = require('../../src/models/Employee');
const TransferRequest = require('../../src/models/TransferRequest');
const controller = require('../../src/controllers/facilitiesArrangement.controller');

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

async function setup(overrides = {}) {
  const location = await Location.create({ name: 'HQ', code: 'HQ01' });
  const department = await Department.create({ name: 'Eng', code: 'ENG' });
  const role = await Role.create({ name: 'Staff', code: 'STF' });
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
    receivingHrId: employee._id,
    status: 'Pending Fulfillment',
    facilitiesStatus: 'Pending',
    ...overrides,
  });

  const facilitiesCaller = { id: new mongoose.Types.ObjectId().toString(), roleCategory: 'Facilities' };
  const nonFacilitiesCaller = { id: new mongoose.Types.ObjectId().toString(), roleCategory: 'Payroll' };

  return { transferRequest, facilitiesCaller, nonFacilitiesCaller };
}

describe('facilitiesArrangement.controller#reportStatus (AC1-AC5)', () => {
  it('AC1 — Done sets facilitiesStatus to Done', async () => {
    const { transferRequest, facilitiesCaller } = await setup();
    const res = mockRes();
    await controller.reportStatus({ employee: facilitiesCaller, params: { id: transferRequest._id.toString() }, body: { status: 'Done' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].facilitiesStatus).toBe('Done');
  });

  it('AC2 — 400 VALIDATION_ERROR when status is missing/invalid', async () => {
    const { transferRequest, facilitiesCaller } = await setup();
    const res = mockRes();
    await controller.reportStatus({ employee: facilitiesCaller, params: { id: transferRequest._id.toString() }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('AC3 — 409 INVALID_STATUS_TRANSITION on a Not Applicable (location-unchanged) item', async () => {
    const { transferRequest, facilitiesCaller } = await setup({ facilitiesStatus: 'Not Applicable' });
    const res = mockRes();
    await controller.reportStatus({ employee: facilitiesCaller, params: { id: transferRequest._id.toString() }, body: { status: 'Done' } }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('AC4 — 403 FORBIDDEN for a non-Facilities caller', async () => {
    const { transferRequest, nonFacilitiesCaller } = await setup();
    const res = mockRes();
    await controller.reportStatus({ employee: nonFacilitiesCaller, params: { id: transferRequest._id.toString() }, body: { status: 'Done' } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('AC5 — 404 NOT_FOUND for a nonexistent id', async () => {
    const { facilitiesCaller } = await setup();
    const res = mockRes();
    await controller.reportStatus({ employee: facilitiesCaller, params: { id: new mongoose.Types.ObjectId().toString() }, body: { status: 'Done' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('facilitiesArrangement.controller#listPending (AC6-AC7)', () => {
  it('AC6 — escalates a request pending for more than 5 business days', async () => {
    const { transferRequest, facilitiesCaller } = await setup();
    transferRequest.statusEnteredAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    await transferRequest.save();
    const res = mockRes();
    await controller.listPending({ employee: facilitiesCaller }, res);
    expect(res.json.mock.calls[0][0][0].escalated).toBe(true);
  });

  it('AC7 — a location-unchanged (Not Applicable) request never appears', async () => {
    const { transferRequest, facilitiesCaller } = await setup();
    const secondLocation = await Location.create({ name: 'HQ2', code: 'HQ02' });
    const secondDept = await Department.create({ name: 'Sales', code: 'SAL' });
    const secondRole = await Role.create({ name: 'Sales', code: 'SLS' });
    const secondEmployee = await Employee.create({ name: 'E2', email: 'e2@example.com', locationId: secondLocation._id, departmentId: secondDept._id, roleId: secondRole._id });
    await TransferRequest.create({
      employeeId: secondEmployee._id,
      currentLocationId: secondLocation._id,
      currentDepartmentId: secondDept._id,
      currentRoleId: secondRole._id,
      newLocationId: secondLocation._id,
      newDepartmentId: secondDept._id,
      newRoleId: secondRole._id,
      effectiveDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      receivingHrId: secondEmployee._id,
      status: 'Pending Fulfillment',
      facilitiesStatus: 'Not Applicable',
    });

    const res = mockRes();
    await controller.listPending({ employee: facilitiesCaller }, res);
    expect(res.json.mock.calls[0][0]).toHaveLength(1);
    expect(res.json.mock.calls[0][0][0]._id.toString()).toBe(transferRequest._id.toString());
  });
});
