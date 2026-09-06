const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const Employee = require('../../src/models/Employee');
const controller = require('../../src/controllers/employee.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
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

async function setupBase() {
  const location = await Location.create({ name: 'HQ', code: 'HQ01' });
  const department = await Department.create({ name: 'Eng', code: 'ENG' });
  const regularRole = await Role.create({ name: 'Staff', code: 'STF' });
  const managerRole = await Role.create({ name: 'Manager', code: 'MGR', category: 'Manager' });
  const hrRole = await Role.create({ name: 'HR', code: 'HR1', category: 'HR' });
  return { location, department, regularRole, managerRole, hrRole };
}

describe('employee.controller#create (AC1-12)', () => {
  it('AC1/AC12 — creates a regular Employee with manager+hr, 201', async () => {
    const { location, department, regularRole, managerRole, hrRole } = await setupBase();
    const manager = await Employee.create({ name: 'M', email: 'm1@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id });
    const hr = await Employee.create({ name: 'H', email: 'h1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });

    const req = { body: { name: 'E', email: 'e1@example.com', password: 'pass123', locationId: location._id, departmentId: department._id, roleId: regularRole._id, managerId: manager._id, hrId: hr._id } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].email).toBe('e1@example.com');
  });

  it('AC4 — 400 MANAGER_REQUIRED propagated from the service', async () => {
    const { location, department, regularRole, hrRole } = await setupBase();
    const hr = await Employee.create({ name: 'H', email: 'h1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });

    const req = { body: { name: 'E', email: 'e1@example.com', password: 'pass123', locationId: location._id, departmentId: department._id, roleId: regularRole._id, hrId: hr._id } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'MANAGER_REQUIRED' } });
  });

  it('required-field VALIDATION_ERROR when roleId is missing', async () => {
    const { location, department } = await setupBase();
    const req = { body: { name: 'E', email: 'e1@example.com', password: 'pass123', locationId: location._id, departmentId: department._id } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'VALIDATION_ERROR' } });
  });

  it('required-field VALIDATION_ERROR when password is missing', async () => {
    const { location, department, hrRole } = await setupBase();
    const req = { body: { name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'VALIDATION_ERROR' } });
  });

  it('AC12 — 409 DUPLICATE_EMAIL', async () => {
    const { location, department, hrRole } = await setupBase();
    await Employee.create({ name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });

    const req = { body: { name: 'E2', email: 'e1@example.com', password: 'pass123', locationId: location._id, departmentId: department._id, roleId: hrRole._id } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'DUPLICATE_EMAIL' } });
  });

  it('AC19 — stores a bcrypt hash of the Admin-supplied password, mustChangePassword:true', async () => {
    const bcrypt = require('bcryptjs');
    const { location, department, hrRole } = await setupBase();
    const req = { body: { name: 'E', email: 'e1@example.com', password: 'admin-set-pass', locationId: location._id, departmentId: department._id, roleId: hrRole._id } };
    const res = mockRes();

    await controller.create(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.mustChangePassword).toBe(true);

    const stored = await Employee.findOne({ email: 'e1@example.com' }).select('+passwordHash');
    expect(stored.passwordHash).not.toBe('admin-set-pass');
    expect(await bcrypt.compare('admin-set-pass', stored.passwordHash)).toBe(true);
  });

  it('AC20 — never includes passwordHash in any response', async () => {
    const { location, department, hrRole } = await setupBase();
    const req = { body: { name: 'E', email: 'e1@example.com', password: 'admin-set-pass', locationId: location._id, departmentId: department._id, roleId: hrRole._id } };
    const res = mockRes();

    await controller.create(req, res);
    const created = res.json.mock.calls[0][0];
    expect(created.passwordHash).toBeUndefined();

    const listRes = mockRes();
    await controller.list({ query: {} }, listRes);
    const listed = listRes.json.mock.calls[0][0][0];
    expect(listed.passwordHash).toBeUndefined();

    const getRes = mockRes();
    await controller.getById({ params: { id: created._id.toString() } }, getRes);
    const fetched = getRes.json.mock.calls[0][0];
    expect(fetched.passwordHash).toBeUndefined();
  });
});

describe('employee.controller#update (AC15)', () => {
  it('AC15 — updates an Employee applying the same validation as create', async () => {
    const { location, department, hrRole, regularRole } = await setupBase();
    const employee = await Employee.create({ name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });

    const req = {
      params: { id: employee._id.toString() },
      body: { name: 'E Updated', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id },
    };
    const res = mockRes();

    await controller.update(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].name).toBe('E Updated');
  });

  it('AC15 — update also enforces mapping validation (MANAGER_REQUIRED)', async () => {
    const { location, department, regularRole } = await setupBase();
    const employee = await Employee.create({
      name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: regularRole._id, managerId: null, hrId: null,
    });

    const req = {
      params: { id: employee._id.toString() },
      body: { name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: regularRole._id },
    };
    const res = mockRes();

    await controller.update(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'MANAGER_REQUIRED' } });
  });
});

describe('employee.controller#list / getById (AC13-14)', () => {
  it('AC13 — list filters by departmentId and isActive', async () => {
    const { location, department, hrRole } = await setupBase();
    const otherDept = await Department.create({ name: 'Sales', code: 'SAL' });
    await Employee.create([
      { name: 'A', email: 'a1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id, isActive: true },
      { name: 'B', email: 'b1@example.com', locationId: location._id, departmentId: otherDept._id, roleId: hrRole._id, isActive: true },
      { name: 'C', email: 'c1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id, isActive: false },
    ]);

    const req = { query: { departmentId: department._id.toString(), isActive: 'true' } };
    const res = mockRes();

    await controller.list(req, res);

    expect(res.json.mock.calls[0][0]).toHaveLength(1);
    expect(res.json.mock.calls[0][0][0].email).toBe('a1@example.com');
  });

  it('AC14 — getById returns match or 404', async () => {
    const { location, department, hrRole } = await setupBase();
    const employee = await Employee.create({ name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });

    const okRes = mockRes();
    await controller.getById({ params: { id: employee._id.toString() } }, okRes);
    expect(okRes.status).toHaveBeenCalledWith(200);

    const nfRes = mockRes();
    await controller.getById({ params: { id: new mongoose.Types.ObjectId().toString() } }, nfRes);
    expect(nfRes.status).toHaveBeenCalledWith(404);
  });
});

describe('employee.controller#setStatus (AC16-17)', () => {
  it('AC16 — deactivates an Employee', async () => {
    const { location, department, hrRole } = await setupBase();
    const employee = await Employee.create({ name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });

    const res = mockRes();
    await controller.setStatus({ params: { id: employee._id.toString() }, body: { isActive: false } }, res);

    expect(res.json.mock.calls[0][0].isActive).toBe(false);
  });

  it('AC17 — reactivates an Employee', async () => {
    const { location, department, hrRole } = await setupBase();
    const employee = await Employee.create({ name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id, isActive: false });

    const res = mockRes();
    await controller.setStatus({ params: { id: employee._id.toString() }, body: { isActive: true } }, res);

    expect(res.json.mock.calls[0][0].isActive).toBe(true);
  });
});

describe('employee.controller#remove (AC21-AC22)', () => {
  it('AC21 — hard-deletes an Employee referenced by no one', async () => {
    const { location, department, hrRole } = await setupBase();
    const employee = await Employee.create({ name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });

    const res = mockRes();
    await controller.remove({ params: { id: employee._id.toString() } }, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(await Employee.findById(employee._id)).toBeNull();
  });

  it('AC22 — 409 EMPLOYEE_HAS_DEPENDENTS when referenced as another Employee\'s hrId', async () => {
    const { location, department, hrRole, regularRole } = await setupBase();
    const hr = await Employee.create({ name: 'H', email: 'hr@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });
    await Employee.create({
      name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: regularRole._id,
      managerId: null, hrId: hr._id,
    });

    const res = mockRes();
    await controller.remove({ params: { id: hr._id.toString() } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'EMPLOYEE_HAS_DEPENDENTS' } });
    expect(await Employee.findById(hr._id)).not.toBeNull();
  });

  it('404 NOT_FOUND for a nonexistent id', async () => {
    const res = mockRes();
    await controller.remove({ params: { id: new mongoose.Types.ObjectId().toString() } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
