const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const DepartmentRole = require('../../src/models/DepartmentRole');
const controller = require('../../src/controllers/department.controller');

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

describe('department.controller#create', () => {
  it('AC1 — creates a Department with isActive true', async () => {
    const req = { body: { name: 'Engineering', code: 'ENG' } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].isActive).toBe(true);
  });

  it('AC2 — 400 VALIDATION_ERROR when name is missing', async () => {
    const req = { body: { code: 'ENG' } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('AC3 — 409 DUPLICATE_CODE for an existing code', async () => {
    await Department.create({ name: 'Engineering', code: 'ENG' });
    const req = { body: { name: 'Eng2', code: 'ENG' } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('department.controller#list / getById', () => {
  it('AC4 — list returns all Departments', async () => {
    await Department.create([
      { name: 'A', code: 'A1', isActive: true },
      { name: 'B', code: 'B1', isActive: false },
    ]);
    const res = mockRes();
    await controller.list({ query: {} }, res);
    expect(res.json.mock.calls[0][0]).toHaveLength(2);
  });

  it('AC5 — list filters by isActive', async () => {
    await Department.create([
      { name: 'A', code: 'A1', isActive: true },
      { name: 'B', code: 'B1', isActive: false },
    ]);
    const res = mockRes();
    await controller.list({ query: { isActive: 'true' } }, res);
    expect(res.json.mock.calls[0][0]).toHaveLength(1);
  });

  it('AC6/AC7 — getById returns match or 404', async () => {
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    const okRes = mockRes();
    await controller.getById({ params: { id: dept._id.toString() } }, okRes);
    expect(okRes.status).toHaveBeenCalledWith(200);

    const notFoundRes = mockRes();
    await controller.getById({ params: { id: new mongoose.Types.ObjectId().toString() } }, notFoundRes);
    expect(notFoundRes.status).toHaveBeenCalledWith(404);
  });
});

describe('department.controller#update', () => {
  it('AC8 — updates name/code', async () => {
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    const res = mockRes();
    await controller.update({ params: { id: dept._id.toString() }, body: { name: 'Eng2', code: 'ENG2' } }, res);
    expect(res.json.mock.calls[0][0].name).toBe('Eng2');
  });

  it('AC9 — 409 DUPLICATE_CODE on conflicting update', async () => {
    const a = await Department.create({ name: 'A', code: 'A1' });
    await Department.create({ name: 'B', code: 'B1' });
    const res = mockRes();
    await controller.update({ params: { id: a._id.toString() }, body: { name: 'A', code: 'B1' } }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('department.controller#setStatus', () => {
  it('AC10 — deactivates with no active Employees mapped', async () => {
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    const res = mockRes();
    await controller.setStatus({ params: { id: dept._id.toString() }, body: { isActive: false } }, res);
    expect(res.json.mock.calls[0][0].isActive).toBe(false);
  });

  it('AC11 — 409 DEPARTMENT_HAS_ACTIVE_EMPLOYEES', async () => {
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    await mongoose.connection.collection('employees').insertOne({ departmentId: dept._id, isActive: true });
    const res = mockRes();
    await controller.setStatus({ params: { id: dept._id.toString() }, body: { isActive: false } }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('AC12 — reactivates', async () => {
    const dept = await Department.create({ name: 'Eng', code: 'ENG', isActive: false });
    const res = mockRes();
    await controller.setStatus({ params: { id: dept._id.toString() }, body: { isActive: true } }, res);
    expect(res.json.mock.calls[0][0].isActive).toBe(true);
  });
});

describe('department.controller#remove (AC18-AC19)', () => {
  it('AC18 — hard-deletes a Department with no mapped Employees, cascading its LocationDepartment/DepartmentRole mappings', async () => {
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    const role = await Role.create({ name: 'Manager', code: 'MGR', category: 'Manager' });
    await DepartmentRole.create({ departmentId: dept._id, roleId: role._id });
    const LocationDepartment = require('../../src/models/LocationDepartment');
    const Location = require('../../src/models/Location');
    const loc = await Location.create({ name: 'HQ', code: 'HQ01' });
    await LocationDepartment.create({ locationId: loc._id, departmentId: dept._id });

    const res = mockRes();
    await controller.remove({ params: { id: dept._id.toString() } }, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(await Department.findById(dept._id)).toBeNull();
    expect(await DepartmentRole.countDocuments({ departmentId: dept._id })).toBe(0);
    expect(await LocationDepartment.countDocuments({ departmentId: dept._id })).toBe(0);
  });

  it('AC19 — 409 DEPARTMENT_HAS_EMPLOYEES for an inactive (not just active) mapped Employee', async () => {
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    await mongoose.connection.collection('employees').insertOne({ departmentId: dept._id, isActive: false });

    const res = mockRes();
    await controller.remove({ params: { id: dept._id.toString() } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'DEPARTMENT_HAS_EMPLOYEES' } });
  });

  it('404 NOT_FOUND for a nonexistent id', async () => {
    const res = mockRes();
    await controller.remove({ params: { id: new mongoose.Types.ObjectId().toString() } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('department.controller Department<->Role mapping', () => {
  it('AC13 — maps a Role to a Department', async () => {
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    const role = await Role.create({ name: 'Manager', code: 'MGR', category: 'Manager' });
    const res = mockRes();
    await controller.mapRole({ params: { id: dept._id.toString() }, body: { roleId: role._id.toString() } }, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('AC14 — 409 MAPPING_ALREADY_EXISTS', async () => {
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    const role = await Role.create({ name: 'Manager', code: 'MGR', category: 'Manager' });
    await DepartmentRole.create({ departmentId: dept._id, roleId: role._id });
    const res = mockRes();
    await controller.mapRole({ params: { id: dept._id.toString() }, body: { roleId: role._id.toString() } }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('AC15 — unmaps a Role', async () => {
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    const role = await Role.create({ name: 'Manager', code: 'MGR', category: 'Manager' });
    await DepartmentRole.create({ departmentId: dept._id, roleId: role._id });
    const res = mockRes();
    await controller.unmapRole({ params: { id: dept._id.toString(), roleId: role._id.toString() } }, res);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('AC16 — lists Roles enabled for a Department', async () => {
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    const role = await Role.create({ name: 'Manager', code: 'MGR', category: 'Manager' });
    await DepartmentRole.create({ departmentId: dept._id, roleId: role._id });
    const res = mockRes();
    await controller.listRoles({ params: { id: dept._id.toString() } }, res);
    expect(res.json.mock.calls[0][0]).toHaveLength(1);
    expect(res.json.mock.calls[0][0][0].code).toBe('MGR');
  });
});
