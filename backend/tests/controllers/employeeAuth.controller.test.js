const bcrypt = require('bcryptjs');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const Employee = require('../../src/models/Employee');
const controller = require('../../src/controllers/employeeAuth.controller');

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

async function createEmployee(overrides = {}) {
  const location = await Location.create({ name: 'HQ', code: 'HQ01' });
  const department = await Department.create({ name: 'Eng', code: 'ENG' });
  const role = await Role.create({ name: 'HR', code: 'HR1', category: 'HR' });
  const passwordHash = await bcrypt.hash('correct-password', 4);
  const employee = await Employee.create({
    name: 'E',
    email: 'e1@example.com',
    locationId: location._id,
    departmentId: department._id,
    roleId: role._id,
    passwordHash,
    ...overrides,
  });
  return { employee, role };
}

describe('employeeAuth.controller#login', () => {
  it('AC1 — 200 with token and profile on correct credentials', async () => {
    const { role } = await createEmployee();
    const req = { body: { email: 'e1@example.com', password: 'correct-password' } };
    const res = mockRes();

    await controller.login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(typeof body.token).toBe('string');
    expect(body.employee.roleCategory).toBe(role.category);
    expect(body.employee.mustChangePassword).toBe(true);
  });

  it('AC1 — login response includes managerId/hrId plus their resolved managerName/hrName', async () => {
    const location = await Location.create({ name: 'HQ2', code: 'HQ02' });
    const department = await Department.create({ name: 'Eng2', code: 'ENG2' });
    const managerRole = await Role.create({ name: 'Manager', code: 'MGRX', category: 'Manager' });
    const hrRole = await Role.create({ name: 'HR2', code: 'HR2X', category: 'HR' });
    const staffRole = await Role.create({ name: 'Staff', code: 'STFX' });
    const hr = await Employee.create({ name: 'HR Person', email: 'hrp@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });
    const manager = await Employee.create({ name: 'Mgr Person', email: 'mgrp@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id, hrId: hr._id });
    const passwordHash = await bcrypt.hash('correct-password', 4);
    await Employee.create({
      name: 'Staffer', email: 'staffer@example.com', locationId: location._id, departmentId: department._id, roleId: staffRole._id, managerId: manager._id, hrId: hr._id, passwordHash,
    });

    const res = mockRes();
    await controller.login({ body: { email: 'staffer@example.com', password: 'correct-password' } }, res);

    const body = res.json.mock.calls[0][0];
    expect(body.employee.managerId.toString()).toBe(manager._id.toString());
    expect(body.employee.hrId.toString()).toBe(hr._id.toString());
    expect(body.employee.managerName).toBe('Mgr Person');
    expect(body.employee.hrName).toBe('HR Person');
  });

  it('AC2 — 401 INVALID_CREDENTIALS on wrong password', async () => {
    await createEmployee();
    const res = mockRes();
    await controller.login({ body: { email: 'e1@example.com', password: 'wrong' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'INVALID_CREDENTIALS' } });
  });

  it('AC2 — 401 INVALID_CREDENTIALS on unknown username', async () => {
    const res = mockRes();
    await controller.login({ body: { email: 'nope@example.com', password: 'x' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('AC3 — 400 VALIDATION_ERROR on empty body', async () => {
    const res = mockRes();
    await controller.login({ body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'VALIDATION_ERROR' } });
  });

  it('AC4 — 403 ACCOUNT_INACTIVE for correct credentials on a deactivated Employee', async () => {
    await createEmployee({ isActive: false });
    const res = mockRes();
    await controller.login({ body: { email: 'e1@example.com', password: 'correct-password' } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'ACCOUNT_INACTIVE' } });
  });
});

describe('employeeAuth.controller#profile', () => {
  it('AC10 — 200 with own data plus locationName/departmentName/roleName/managerName/hrName resolved', async () => {
    const location = await Location.create({ name: 'HQ3', code: 'HQ03' });
    const department = await Department.create({ name: 'Eng3', code: 'ENG3' });
    const managerRole = await Role.create({ name: 'Manager', code: 'MGRY', category: 'Manager' });
    const hrRole = await Role.create({ name: 'HR3', code: 'HR3X', category: 'HR' });
    const staffRole = await Role.create({ name: 'Staff', code: 'STFY' });
    const hr = await Employee.create({ name: 'HR Person', email: 'hrp2@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });
    const manager = await Employee.create({ name: 'Mgr Person', email: 'mgrp2@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id, hrId: hr._id });
    const staffer = await Employee.create({
      name: 'Staffer', email: 'staffer2@example.com', locationId: location._id, departmentId: department._id, roleId: staffRole._id, managerId: manager._id, hrId: hr._id,
    });

    const res = mockRes();
    await controller.profile({ employee: { id: staffer._id.toString() } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.name).toBe('Staffer');
    expect(body.locationName).toBe('HQ3');
    expect(body.departmentName).toBe('Eng3');
    expect(body.roleName).toBe('Staff');
    expect(body.roleCategory).toBe(null);
    expect(body.managerName).toBe('Mgr Person');
    expect(body.hrName).toBe('HR Person');
  });

  it('AC10 — managerName/hrName are null when the Employee has no managerId/hrId (e.g. an HR-category Employee)', async () => {
    const { employee } = await createEmployee();
    const res = mockRes();
    await controller.profile({ employee: { id: employee._id.toString() } }, res);

    const body = res.json.mock.calls[0][0];
    expect(body.managerId).toBe(null);
    expect(body.managerName).toBe(null);
    expect(body.hrId).toBe(null);
    expect(body.hrName).toBe(null);
  });
});

describe('employeeAuth.controller#changePassword', () => {
  it('AC5 — 200, updates the hash and clears mustChangePassword', async () => {
    const { employee } = await createEmployee();
    const res = mockRes();
    await controller.changePassword(
      { employee: { id: employee._id.toString() }, body: { currentPassword: 'correct-password', newPassword: 'new-pass' } },
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);

    const updated = await Employee.findById(employee._id).select('+passwordHash');
    expect(updated.mustChangePassword).toBe(false);
    expect(await bcrypt.compare('new-pass', updated.passwordHash)).toBe(true);
  });

  it('AC6 — 400 INVALID_CURRENT_PASSWORD when currentPassword is wrong', async () => {
    const { employee } = await createEmployee();
    const res = mockRes();
    await controller.changePassword(
      { employee: { id: employee._id.toString() }, body: { currentPassword: 'wrong', newPassword: 'new-pass' } },
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'INVALID_CURRENT_PASSWORD' } });
  });

  it('AC7 — 400 VALIDATION_ERROR when newPassword is missing', async () => {
    const { employee } = await createEmployee();
    const res = mockRes();
    await controller.changePassword(
      { employee: { id: employee._id.toString() }, body: { currentPassword: 'correct-password' } },
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'VALIDATION_ERROR' } });
  });

  it('AC9 — a second voluntary change succeeds identically', async () => {
    const { employee } = await createEmployee();
    const firstRes = mockRes();
    await controller.changePassword(
      { employee: { id: employee._id.toString() }, body: { currentPassword: 'correct-password', newPassword: 'new-pass' } },
      firstRes
    );
    expect(firstRes.status).toHaveBeenCalledWith(200);

    const secondRes = mockRes();
    await controller.changePassword(
      { employee: { id: employee._id.toString() }, body: { currentPassword: 'new-pass', newPassword: 'newer-pass' } },
      secondRes
    );
    expect(secondRes.status).toHaveBeenCalledWith(200);
  });
});
