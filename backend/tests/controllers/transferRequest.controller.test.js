const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const DepartmentRole = require('../../src/models/DepartmentRole');
const Employee = require('../../src/models/Employee');
const TransferRequest = require('../../src/models/TransferRequest');
const controller = require('../../src/controllers/transferRequest.controller');

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

function farEnoughDate() {
  return new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString();
}

async function setupSubmitter() {
  const currentLocation = await Location.create({ name: 'Delhi', code: 'DEL' });
  const currentDept = await Department.create({ name: 'Eng', code: 'ENG' });
  const regularRole = await Role.create({ name: 'Staff', code: 'STF' });
  const managerRole = await Role.create({ name: 'Manager', code: 'MGR', category: 'Manager' });
  const hrRole = await Role.create({ name: 'HR', code: 'HR1', category: 'HR' });
  await DepartmentRole.create([
    { departmentId: currentDept._id, roleId: regularRole._id },
    { departmentId: currentDept._id, roleId: managerRole._id },
    { departmentId: currentDept._id, roleId: hrRole._id },
  ]);
  const manager = await Employee.create({ name: 'M', email: 'm1@example.com', locationId: currentLocation._id, departmentId: currentDept._id, roleId: managerRole._id });
  const hr = await Employee.create({ name: 'H', email: 'h1@example.com', locationId: currentLocation._id, departmentId: currentDept._id, roleId: hrRole._id });
  const submitter = await Employee.create({
    name: 'S', email: 's1@example.com', locationId: currentLocation._id, departmentId: currentDept._id, roleId: regularRole._id, managerId: manager._id, hrId: hr._id,
  });

  const newLocation = await Location.create({ name: 'Mumbai', code: 'BOM' });
  const newDept = await Department.create({ name: 'Sales', code: 'SAL' });
  const newRole = await Role.create({ name: 'Sales Exec', code: 'SALES1' });
  await DepartmentRole.create({ departmentId: newDept._id, roleId: newRole._id });
  const receivingHr = await Employee.create({ name: 'RHR', email: 'rhr1@example.com', locationId: newLocation._id, departmentId: newDept._id, roleId: hrRole._id });

  return { submitter, currentLocation, currentDept, managerRole, newLocation, newDept, newRole, receivingHr };
}

describe('transferRequest.controller#create (AC1-AC9)', () => {
  it('AC1 — creates a request, snapshotting Current Manager/HR and resolving Receiving HR', async () => {
    const { submitter, newLocation, newDept, newRole, receivingHr } = await setupSubmitter();
    const req = {
      employee: { id: submitter._id.toString() },
      body: { newLocationId: newLocation._id, newDepartmentId: newDept._id, newRoleId: newRole._id, effectiveDate: farEnoughDate() },
    };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('Pending Current Manager Approval');
    expect(body.receivingHrId.toString()).toBe(receivingHr._id.toString());
    expect(body.currentManagerId).toBeTruthy();
    expect(body.currentHrId).toBeTruthy();
  });

  it('AC2 — 400 EFFECTIVE_DATE_TOO_SOON', async () => {
    const { submitter, newLocation, newDept, newRole } = await setupSubmitter();
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const req = { employee: { id: submitter._id.toString() }, body: { newLocationId: newLocation._id, newDepartmentId: newDept._id, newRoleId: newRole._id, effectiveDate: soon } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'EFFECTIVE_DATE_TOO_SOON' } });
  });

  it('AC3 — 409 ACTIVE_REQUEST_EXISTS when a non-terminal request already exists', async () => {
    const { submitter, newLocation, newDept, newRole, receivingHr } = await setupSubmitter();
    await TransferRequest.create({
      employeeId: submitter._id, currentLocationId: submitter.locationId, currentDepartmentId: submitter.departmentId, currentRoleId: submitter.roleId,
      newLocationId: newLocation._id, newDepartmentId: newDept._id, newRoleId: newRole._id, effectiveDate: farEnoughDate(), receivingHrId: receivingHr._id,
      status: 'Hold',
    });

    const req = { employee: { id: submitter._id.toString() }, body: { newLocationId: newLocation._id, newDepartmentId: newDept._id, newRoleId: newRole._id, effectiveDate: farEnoughDate() } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'ACTIVE_REQUEST_EXISTS' } });
  });

  it('AC4 — 404 NOT_FOUND for a nonexistent newDepartmentId', async () => {
    const { submitter, newLocation, newRole } = await setupSubmitter();
    const req = { employee: { id: submitter._id.toString() }, body: { newLocationId: newLocation._id, newDepartmentId: new mongoose.Types.ObjectId(), newRoleId: newRole._id, effectiveDate: farEnoughDate() } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'NOT_FOUND' } });
  });

  it('AC14 — 400 ROLE_CATEGORY_NOT_ALLOWED when newRoleId is a Manager-category Role', async () => {
    const { submitter, newLocation, newDept, managerRole } = await setupSubmitter();
    await DepartmentRole.create({ departmentId: newDept._id, roleId: managerRole._id });
    const req = { employee: { id: submitter._id.toString() }, body: { newLocationId: newLocation._id, newDepartmentId: newDept._id, newRoleId: managerRole._id, effectiveDate: farEnoughDate() } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'ROLE_CATEGORY_NOT_ALLOWED' } });
  });

  it('AC5 — auto-enables an unmapped newRoleId for newDepartmentId and creates the request', async () => {
    const { submitter, newLocation, newDept, receivingHr } = await setupSubmitter();
    const unmappedRole = await Role.create({ name: 'Unmapped', code: 'UNM1' });
    const req = { employee: { id: submitter._id.toString() }, body: { newLocationId: newLocation._id, newDepartmentId: newDept._id, newRoleId: unmappedRole._id, effectiveDate: farEnoughDate() } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].receivingHrId.toString()).toBe(receivingHr._id.toString());

    const mapping = await DepartmentRole.findOne({ departmentId: newDept._id, roleId: unmappedRole._id });
    expect(mapping).not.toBeNull();
  });

  it('AC12 — 400 NO_CHANGE_REQUESTED when newLocationId, newDepartmentId, AND newRoleId all match current', async () => {
    const { submitter, currentLocation, currentDept } = await setupSubmitter();
    const req = {
      employee: { id: submitter._id.toString() },
      body: { newLocationId: currentLocation._id, newDepartmentId: currentDept._id, newRoleId: submitter.roleId, effectiveDate: farEnoughDate() },
    };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'NO_CHANGE_REQUESTED' } });
  });

  it('AC13 — proceeds normally when only newRoleId differs (newLocationId+newDepartmentId match current)', async () => {
    const { submitter, currentLocation, currentDept } = await setupSubmitter();
    const otherRegularRole = await Role.create({ name: 'Other Staff', code: 'OSTF' });
    const req = {
      employee: { id: submitter._id.toString() },
      body: { newLocationId: currentLocation._id, newDepartmentId: currentDept._id, newRoleId: otherRegularRole._id, effectiveDate: farEnoughDate() },
    };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('AC13 — proceeds normally when only newDepartmentId differs (newLocationId matches current)', async () => {
    const { submitter, currentLocation, newRole } = await setupSubmitter();
    const sameLocationNewDept = await Department.create({ name: 'Marketing', code: 'MKT' });
    await DepartmentRole.create({ departmentId: sameLocationNewDept._id, roleId: newRole._id });
    const hrRole = await Role.create({ name: 'HR2', code: 'HR2X', category: 'HR' });
    const receivingHr = await Employee.create({
      name: 'RHR2', email: 'rhr2@example.com', locationId: currentLocation._id, departmentId: sameLocationNewDept._id, roleId: hrRole._id,
    });

    const req = {
      employee: { id: submitter._id.toString() },
      body: { newLocationId: currentLocation._id, newDepartmentId: sameLocationNewDept._id, newRoleId: newRole._id, effectiveDate: farEnoughDate() },
    };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].receivingHrId.toString()).toBe(receivingHr._id.toString());
  });

  it('AC7 — 404 NO_RECEIVING_HR when the target has no active HR-category Employee', async () => {
    const { submitter, newLocation } = await setupSubmitter();
    const deptWithNoHr = await Department.create({ name: 'Ops', code: 'OPS' });
    const role = await Role.create({ name: 'Ops Staff', code: 'OPS1' });
    await DepartmentRole.create({ departmentId: deptWithNoHr._id, roleId: role._id });

    const req = { employee: { id: submitter._id.toString() }, body: { newLocationId: newLocation._id, newDepartmentId: deptWithNoHr._id, newRoleId: role._id, effectiveDate: farEnoughDate() } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'NO_RECEIVING_HR' } });
  });

  it('AC8 — 400 VALIDATION_ERROR when required fields are missing', async () => {
    const { submitter } = await setupSubmitter();
    const res = mockRes();
    await controller.create({ employee: { id: submitter._id.toString() }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'VALIDATION_ERROR' } });
  });
});

describe('transferRequest.controller#listMine / getById (AC10-AC11)', () => {
  it('AC10 — lists all of the caller\'s requests, newest first, with current/receiving Manager/HR names resolved', async () => {
    const { submitter, newLocation, newDept, newRole, receivingHr, managerRole } = await setupSubmitter();
    const receivingManager = await Employee.create({
      name: 'RM', email: 'rm-ac10@example.com', locationId: newLocation._id, departmentId: newDept._id, roleId: managerRole._id,
    });
    const base = {
      employeeId: submitter._id, currentLocationId: submitter.locationId, currentDepartmentId: submitter.departmentId, currentRoleId: submitter.roleId,
      newLocationId: newLocation._id, newDepartmentId: newDept._id, newRoleId: newRole._id, effectiveDate: farEnoughDate(), receivingHrId: receivingHr._id,
      currentManagerId: submitter.managerId, currentHrId: submitter.hrId,
    };
    await TransferRequest.create({ ...base, status: 'Rejected' });
    await TransferRequest.create({ ...base, status: 'Pending Receiving Manager Approval', receivingManagerId: receivingManager._id });

    const res = mockRes();
    await controller.listMine({ employee: { id: submitter._id.toString() } }, res);

    const body = res.json.mock.calls[0][0];
    expect(body).toHaveLength(2);
    expect(body[0].currentManagerName).toBe('M');
    expect(body[0].currentHrName).toBe('H');
    expect(body[0].receivingHrName).toBe(receivingHr.name);
    // Newest first — the second-created (Pending Receiving Manager Approval) request is body[0].
    expect(body[0].receivingManagerName).toBe('RM');
    // The first-created (Rejected, never reached Receiving HR accept) has no receivingManagerId yet.
    expect(body[1].receivingManagerName).toBeNull();
  });

  it('AC11 — 403 FORBIDDEN when the request belongs to a different Employee', async () => {
    const { submitter, newLocation, newDept, newRole, receivingHr } = await setupSubmitter();
    const other = await Employee.create({ name: 'O', email: 'o1@example.com', locationId: submitter.locationId, departmentId: submitter.departmentId, roleId: submitter.roleId });
    const request = await TransferRequest.create({
      employeeId: other._id, currentLocationId: submitter.locationId, currentDepartmentId: submitter.departmentId, currentRoleId: submitter.roleId,
      newLocationId: newLocation._id, newDepartmentId: newDept._id, newRoleId: newRole._id, effectiveDate: farEnoughDate(), receivingHrId: receivingHr._id,
    });

    const res = mockRes();
    await controller.getById({ employee: { id: submitter._id.toString() }, params: { id: request._id.toString() } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'FORBIDDEN' } });
  });

  it('returns the request when it belongs to the caller', async () => {
    const { submitter, newLocation, newDept, newRole, receivingHr } = await setupSubmitter();
    const request = await TransferRequest.create({
      employeeId: submitter._id, currentLocationId: submitter.locationId, currentDepartmentId: submitter.departmentId, currentRoleId: submitter.roleId,
      newLocationId: newLocation._id, newDepartmentId: newDept._id, newRoleId: newRole._id, effectiveDate: farEnoughDate(), receivingHrId: receivingHr._id,
    });

    const res = mockRes();
    await controller.getById({ employee: { id: submitter._id.toString() }, params: { id: request._id.toString() } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
