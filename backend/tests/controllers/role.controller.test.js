const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Role = require('../../src/models/Role');
const Department = require('../../src/models/Department');
const DepartmentRole = require('../../src/models/DepartmentRole');
const controller = require('../../src/controllers/role.controller');

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

describe('role.controller#create', () => {
  it('AC1 — creates a Role with no category', async () => {
    const res = mockRes();
    await controller.create({ body: { name: 'Staff', code: 'STF' } }, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].category).toBeNull();
  });

  it('AC2 — creates a Role with category Manager', async () => {
    const res = mockRes();
    await controller.create({ body: { name: 'Manager', code: 'MGR', category: 'Manager' } }, res);
    expect(res.json.mock.calls[0][0].category).toBe('Manager');
  });

  it('AC3 — creates a Role with category HR', async () => {
    const res = mockRes();
    await controller.create({ body: { name: 'HR', code: 'HR1', category: 'HR' } }, res);
    expect(res.json.mock.calls[0][0].category).toBe('HR');
  });

  it('AC4 — 400 INVALID_CATEGORY for an unsupported category value', async () => {
    const res = mockRes();
    await controller.create({ body: { name: 'X', code: 'X1', category: 'Admin' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'INVALID_CATEGORY' } });
  });

  it('AC5 — 400 VALIDATION_ERROR for missing code', async () => {
    const res = mockRes();
    await controller.create({ body: { name: 'X' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'VALIDATION_ERROR' } });
  });

  it('AC6 — 409 DUPLICATE_CODE', async () => {
    await Role.create({ name: 'Staff', code: 'STF' });
    const res = mockRes();
    await controller.create({ body: { name: 'Staff2', code: 'STF' } }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('AC18 — creates a Role with category Payroll, IT, or Facilities', async () => {
    const payrollRes = mockRes();
    await controller.create({ body: { name: 'Payroll Officer', code: 'PAY1', category: 'Payroll' } }, payrollRes);
    expect(payrollRes.status).toHaveBeenCalledWith(201);
    expect(payrollRes.json.mock.calls[0][0].category).toBe('Payroll');

    const itRes = mockRes();
    await controller.create({ body: { name: 'IT Support', code: 'IT1', category: 'IT' } }, itRes);
    expect(itRes.json.mock.calls[0][0].category).toBe('IT');

    const facilitiesRes = mockRes();
    await controller.create({ body: { name: 'Facilities Officer', code: 'FAC1', category: 'Facilities' } }, facilitiesRes);
    expect(facilitiesRes.json.mock.calls[0][0].category).toBe('Facilities');
  });
});

describe('role.controller#list / getById', () => {
  it('AC7 — list with no filter returns all', async () => {
    await Role.create([{ name: 'A', code: 'A1' }, { name: 'B', code: 'B1', isActive: false }]);
    const res = mockRes();
    await controller.list({ query: {} }, res);
    expect(res.json.mock.calls[0][0]).toHaveLength(2);
  });

  it('AC8 — list filters by isActive', async () => {
    await Role.create([{ name: 'A', code: 'A1' }, { name: 'B', code: 'B1', isActive: false }]);
    const res = mockRes();
    await controller.list({ query: { isActive: 'true' } }, res);
    expect(res.json.mock.calls[0][0]).toHaveLength(1);
  });

  it('AC9 — list filters by category', async () => {
    await Role.create([{ name: 'A', code: 'A1', category: 'HR' }, { name: 'B', code: 'B1' }]);
    const res = mockRes();
    await controller.list({ query: { category: 'HR' } }, res);
    expect(res.json.mock.calls[0][0]).toHaveLength(1);
  });

  it('AC10/AC11 — getById returns match or 404', async () => {
    const role = await Role.create({ name: 'A', code: 'A1' });
    const okRes = mockRes();
    await controller.getById({ params: { id: role._id.toString() } }, okRes);
    expect(okRes.status).toHaveBeenCalledWith(200);

    const nfRes = mockRes();
    await controller.getById({ params: { id: new mongoose.Types.ObjectId().toString() } }, nfRes);
    expect(nfRes.status).toHaveBeenCalledWith(404);
  });
});

describe('role.controller#update', () => {
  it('AC12 — updates name/code/category', async () => {
    const role = await Role.create({ name: 'A', code: 'A1' });
    const res = mockRes();
    await controller.update({ params: { id: role._id.toString() }, body: { name: 'A2', code: 'A2', category: 'HR' } }, res);
    expect(res.json.mock.calls[0][0].category).toBe('HR');
  });

  it('AC13 — 409 DUPLICATE_CODE on conflicting update', async () => {
    const a = await Role.create({ name: 'A', code: 'A1' });
    await Role.create({ name: 'B', code: 'B1' });
    const res = mockRes();
    await controller.update({ params: { id: a._id.toString() }, body: { name: 'A', code: 'B1' } }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('role.controller#setStatus', () => {
  it('AC14 — deactivates with no Employees holding it', async () => {
    const role = await Role.create({ name: 'A', code: 'A1' });
    const res = mockRes();
    await controller.setStatus({ params: { id: role._id.toString() }, body: { isActive: false } }, res);
    expect(res.json.mock.calls[0][0].isActive).toBe(false);
  });

  it('AC15 — 409 ROLE_HAS_ACTIVE_EMPLOYEES', async () => {
    const role = await Role.create({ name: 'A', code: 'A1' });
    await mongoose.connection.collection('employees').insertOne({ roleId: role._id, isActive: true });
    const res = mockRes();
    await controller.setStatus({ params: { id: role._id.toString() }, body: { isActive: false } }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('AC16 — reactivates', async () => {
    const role = await Role.create({ name: 'A', code: 'A1', isActive: false });
    const res = mockRes();
    await controller.setStatus({ params: { id: role._id.toString() }, body: { isActive: true } }, res);
    expect(res.json.mock.calls[0][0].isActive).toBe(true);
  });
});

describe('role.controller#remove (AC19-AC20)', () => {
  it('AC19 — hard-deletes a Role with no Employees holding it, cascading its DepartmentRole mappings', async () => {
    const role = await Role.create({ name: 'A', code: 'A1' });
    const department = await Department.create({ name: 'Eng', code: 'ENG' });
    await DepartmentRole.create({ departmentId: department._id, roleId: role._id });

    const res = mockRes();
    await controller.remove({ params: { id: role._id.toString() } }, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(await Role.findById(role._id)).toBeNull();
    expect(await DepartmentRole.countDocuments({ roleId: role._id })).toBe(0);
  });

  it('AC20 — 409 ROLE_HAS_EMPLOYEES for an inactive (not just active) Employee holding it', async () => {
    const role = await Role.create({ name: 'A', code: 'A1' });
    await mongoose.connection.collection('employees').insertOne({ roleId: role._id, isActive: false });

    const res = mockRes();
    await controller.remove({ params: { id: role._id.toString() } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'ROLE_HAS_EMPLOYEES' } });
  });

  it('404 NOT_FOUND for a nonexistent id', async () => {
    const res = mockRes();
    await controller.remove({ params: { id: new mongoose.Types.ObjectId().toString() } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
