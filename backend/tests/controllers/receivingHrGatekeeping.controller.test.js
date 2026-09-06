const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const Employee = require('../../src/models/Employee');
const TransferRequest = require('../../src/models/TransferRequest');
const controller = require('../../src/controllers/receivingHrGatekeeping.controller');

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
  const currentLocation = await Location.create({ name: 'Delhi', code: 'DEL' });
  const newLocation = await Location.create({ name: 'Mumbai', code: 'BOM' });
  const newDept = await Department.create({ name: 'Sales', code: 'SAL' });
  const staffRole = await Role.create({ name: 'Staff', code: 'STF' });
  const managerRole = await Role.create({ name: 'Manager', code: 'MGR', category: 'Manager' });
  const hrRole = await Role.create({ name: 'HR', code: 'HR1', category: 'HR' });

  const receivingHr = await Employee.create({ name: 'RHR', email: 'rhr1@example.com', locationId: newLocation._id, departmentId: newDept._id, roleId: hrRole._id });
  const otherHr = await Employee.create({ name: 'RHR2', email: 'rhr2@example.com', locationId: newLocation._id, departmentId: newDept._id, roleId: hrRole._id });
  const manager1 = await Employee.create({ name: 'M1', email: 'rm1@example.com', locationId: newLocation._id, departmentId: newDept._id, roleId: managerRole._id });
  const manager2 = await Employee.create({ name: 'M2', email: 'rm2@example.com', locationId: newLocation._id, departmentId: newDept._id, roleId: managerRole._id });
  const employee = await Employee.create({ name: 'E', email: 'e1@example.com', locationId: currentLocation._id, departmentId: newDept._id, roleId: staffRole._id });

  const transferRequest = await TransferRequest.create({
    employeeId: employee._id,
    currentLocationId: currentLocation._id,
    currentDepartmentId: newDept._id,
    currentRoleId: staffRole._id,
    newLocationId: newLocation._id,
    newDepartmentId: newDept._id,
    newRoleId: staffRole._id,
    effectiveDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    receivingHrId: receivingHr._id,
    status: 'Pending Receiving HR Approval',
    ...overrides,
  });

  return { currentLocation, newLocation, newDept, staffRole, managerRole, hrRole, receivingHr, otherHr, manager1, manager2, employee, transferRequest };
}

describe('receivingHrGatekeeping.controller#gateDecision (AC1-AC3)', () => {
  it('AC1 — accept assigns a manager and advances status, but leaves the Employee record unchanged (deferred to effectiveDate)', async () => {
    const { receivingHr, manager1, employee, transferRequest, currentLocation } = await setup();
    const res = mockRes();

    await controller.gateDecision(
      { employee: { id: receivingHr._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'accept', assignedManagerId: manager1._id.toString() } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('Pending Receiving Manager Approval');
    expect(body.receivingManagerId.toString()).toBe(manager1._id.toString());

    const updatedEmployee = await Employee.findById(employee._id);
    expect(updatedEmployee.locationId.toString()).toBe(currentLocation._id.toString());
    expect(updatedEmployee.managerId).toBeNull();
    expect(updatedEmployee.hrId).toBeNull();
  });

  it('AC2 — reject sets status Rejected and does not touch the Employee record', async () => {
    const { receivingHr, employee, transferRequest } = await setup();
    const before = await Employee.findById(employee._id);
    const res = mockRes();

    await controller.gateDecision(
      { employee: { id: receivingHr._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'reject' } },
      res
    );

    expect(res.json.mock.calls[0][0].status).toBe('Rejected');
    const after = await Employee.findById(employee._id);
    expect(after.locationId.toString()).toBe(before.locationId.toString());
  });

  it('AC3 — 400 INVALID_MANAGER_ROLE when assignedManagerId is not a Manager-category Employee in scope', async () => {
    const { receivingHr, otherHr, transferRequest } = await setup();
    const res = mockRes();

    await controller.gateDecision(
      { employee: { id: receivingHr._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'accept', assignedManagerId: otherHr._id.toString() } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'INVALID_MANAGER_ROLE' } });
  });
});

describe('receivingHrGatekeeping.controller#reassignManager (AC4)', () => {
  it('AC4 — assigns the new candidate and moves to Pending Receiving Manager Approval', async () => {
    const { receivingHr, manager2, transferRequest } = await setup({ status: 'Pending Receiving HR Reassignment' });
    const res = mockRes();

    await controller.reassignManager(
      { employee: { id: receivingHr._id.toString() }, params: { id: transferRequest._id.toString() }, body: { assignedManagerId: manager2._id.toString() } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].status).toBe('Pending Receiving Manager Approval');
    expect(res.json.mock.calls[0][0].receivingManagerId.toString()).toBe(manager2._id.toString());
  });
});

describe('receivingHrGatekeeping.controller#triggerFulfillment (AC5)', () => {
  it('AC5 — sets payroll/it Pending and facilities Pending when location changed', async () => {
    const { receivingHr, transferRequest } = await setup({ status: 'Pending Fulfillment Trigger' });
    const res = mockRes();

    await controller.triggerFulfillment({ employee: { id: receivingHr._id.toString() }, params: { id: transferRequest._id.toString() } }, res);

    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('Pending Fulfillment');
    expect(body.payrollStatus).toBe('Pending');
    expect(body.itStatus).toBe('Pending');
    expect(body.facilitiesStatus).toBe('Pending');
  });

  it('AC5 — sets facilities Not Applicable when location is unchanged', async () => {
    const { receivingHr, currentLocation, transferRequest } = await setup({ status: 'Pending Fulfillment Trigger' });
    transferRequest.newLocationId = currentLocation._id;
    await transferRequest.save();
    const res = mockRes();

    await controller.triggerFulfillment({ employee: { id: receivingHr._id.toString() }, params: { id: transferRequest._id.toString() } }, res);

    expect(res.json.mock.calls[0][0].facilitiesStatus).toBe('Not Applicable');
  });

  it('AC6/AC7 — listFulfillmentPending surfaces a request still awaiting trigger, not only already-triggered ones', async () => {
    const { receivingHr } = await setup({ status: 'Pending Fulfillment Trigger' });
    const res = mockRes();

    await controller.listFulfillmentPending({ employee: { id: receivingHr._id.toString() } }, res);

    const body = res.json.mock.calls[0][0];
    expect(body).toHaveLength(1);
    expect(body[0].status).toBe('Pending Fulfillment Trigger');
  });
});

describe('receivingHrGatekeeping.controller#confirmCompletion (AC7-AC8)', () => {
  it('AC7 — completes when all applicable sub-statuses are Done', async () => {
    const { receivingHr, transferRequest } = await setup({ status: 'Pending Fulfillment', payrollStatus: 'Done', itStatus: 'Done', facilitiesStatus: 'Not Applicable' });
    const res = mockRes();

    await controller.confirmCompletion({ employee: { id: receivingHr._id.toString() }, params: { id: transferRequest._id.toString() } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].status).toBe('Completed');
  });

  it('AC8 — 409 FULFILLMENT_INCOMPLETE when one sub-status is still pending', async () => {
    const { receivingHr, transferRequest } = await setup({ status: 'Pending Fulfillment', payrollStatus: 'Done', itStatus: 'Pending', facilitiesStatus: 'Not Applicable' });
    const res = mockRes();

    await controller.confirmCompletion({ employee: { id: receivingHr._id.toString() }, params: { id: transferRequest._id.toString() } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'FULFILLMENT_INCOMPLETE' } });
  });
});

describe('receivingHrGatekeeping.controller#reopenHold (AC9-AC10)', () => {
  it('AC9 — reopens a hold within the 6-month window', async () => {
    const holdStartedAt = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const { receivingHr, manager1, transferRequest } = await setup({ status: 'Hold', holdStartedAt, holdReason: 'All managers rejected' });
    const res = mockRes();

    await controller.reopenHold(
      { employee: { id: receivingHr._id.toString() }, params: { id: transferRequest._id.toString() }, body: { assignedManagerId: manager1._id.toString() } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].status).toBe('Pending Receiving Manager Approval');
  });

  it('AC10 — 409 HOLD_WINDOW_EXPIRED past 6 months', async () => {
    const holdStartedAt = new Date(Date.now() - 210 * 24 * 60 * 60 * 1000);
    const { receivingHr, manager1, transferRequest } = await setup({ status: 'Hold', holdStartedAt, holdReason: 'All managers rejected' });
    const res = mockRes();

    await controller.reopenHold(
      { employee: { id: receivingHr._id.toString() }, params: { id: transferRequest._id.toString() }, body: { assignedManagerId: manager1._id.toString() } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'HOLD_WINDOW_EXPIRED' } });
  });
});

describe('receivingHrGatekeeping.controller — cross-cutting (AC11-AC14)', () => {
  it('AC11 — 403 FORBIDDEN when caller is not the assigned Receiving HR', async () => {
    const { otherHr, transferRequest } = await setup();
    const res = mockRes();
    await controller.gateDecision({ employee: { id: otherHr._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'reject' } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('AC12 — 409 INVALID_STATUS_TRANSITION on the wrong status', async () => {
    const { receivingHr, transferRequest } = await setup({ status: 'Pending Receiving Manager Approval' });
    const res = mockRes();
    await controller.gateDecision({ employee: { id: receivingHr._id.toString() }, params: { id: transferRequest._id.toString() }, body: { decision: 'reject' } }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('AC13 — 404 NOT_FOUND for a nonexistent id', async () => {
    const { receivingHr } = await setup();
    const res = mockRes();
    await controller.gateDecision({ employee: { id: receivingHr._id.toString() }, params: { id: new mongoose.Types.ObjectId().toString() }, body: { decision: 'reject' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('AC14 — gate and fulfillment queues are scoped to the assigned Receiving HR and correct status', async () => {
    const { receivingHr, otherHr, transferRequest } = await setup();
    const gateRes = mockRes();
    await controller.listGatePending({ employee: { id: receivingHr._id.toString() } }, gateRes);
    expect(gateRes.json.mock.calls[0][0]).toHaveLength(1);

    const otherRes = mockRes();
    await controller.listGatePending({ employee: { id: otherHr._id.toString() } }, otherRes);
    expect(otherRes.json.mock.calls[0][0]).toHaveLength(0);

    transferRequest.status = 'Pending Fulfillment';
    await transferRequest.save();
    const fulfillmentRes = mockRes();
    await controller.listFulfillmentPending({ employee: { id: receivingHr._id.toString() } }, fulfillmentRes);
    expect(fulfillmentRes.json.mock.calls[0][0]).toHaveLength(1);
  });
});

describe('receivingHrGatekeeping.controller#listReassignmentPending / #listHoldPending', () => {
  it('lists only the caller-owned requests in the matching status', async () => {
    const { receivingHr, otherHr, transferRequest } = await setup({ status: 'Pending Receiving HR Reassignment' });
    const res = mockRes();
    await controller.listReassignmentPending({ employee: { id: receivingHr._id.toString() } }, res);
    expect(res.json.mock.calls[0][0]).toHaveLength(1);

    const otherRes = mockRes();
    await controller.listReassignmentPending({ employee: { id: otherHr._id.toString() } }, otherRes);
    expect(otherRes.json.mock.calls[0][0]).toHaveLength(0);

    transferRequest.status = 'Hold';
    transferRequest.holdStartedAt = new Date();
    await transferRequest.save();

    const holdRes = mockRes();
    await controller.listHoldPending({ employee: { id: receivingHr._id.toString() } }, holdRes);
    expect(holdRes.json.mock.calls[0][0]).toHaveLength(1);

    const gateRes = mockRes();
    await controller.listGatePending({ employee: { id: receivingHr._id.toString() } }, gateRes);
    expect(gateRes.json.mock.calls[0][0]).toHaveLength(0);
  });
});
