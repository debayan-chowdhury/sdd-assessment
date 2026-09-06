const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const LocationDepartment = require('../../src/models/LocationDepartment');
const controller = require('../../src/controllers/location.controller');

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

describe('location.controller#create', () => {
  it('AC1 — creates a Location with isActive true', async () => {
    const req = { body: { name: 'HQ', code: 'HQ01' } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.name).toBe('HQ');
    expect(body.code).toBe('HQ01');
    expect(body.isActive).toBe(true);
  });

  it('AC2 — 400 VALIDATION_ERROR when code is missing', async () => {
    const req = { body: { name: 'HQ' } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'VALIDATION_ERROR' } });
  });

  it('AC3 — 409 DUPLICATE_CODE when code already exists', async () => {
    await Location.create({ name: 'HQ', code: 'HQ01' });
    const req = { body: { name: 'Branch', code: 'HQ01' } };
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'DUPLICATE_CODE' } });
  });
});

describe('location.controller#list / getById', () => {
  it('AC4 — list returns all Locations regardless of status', async () => {
    await Location.create([
      { name: 'A', code: 'A1', isActive: true },
      { name: 'B', code: 'B1', isActive: false },
    ]);
    const req = { query: {} };
    const res = mockRes();

    await controller.list(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toHaveLength(2);
  });

  it('AC5 — list filters by isActive=true', async () => {
    await Location.create([
      { name: 'A', code: 'A1', isActive: true },
      { name: 'B', code: 'B1', isActive: false },
    ]);
    const req = { query: { isActive: 'true' } };
    const res = mockRes();

    await controller.list(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body).toHaveLength(1);
    expect(body[0].code).toBe('A1');
  });

  it('AC6 — getById returns the matching Location', async () => {
    const loc = await Location.create({ name: 'HQ', code: 'HQ01' });
    const req = { params: { id: loc._id.toString() } };
    const res = mockRes();

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].code).toBe('HQ01');
  });

  it('AC7 — getById 404 NOT_FOUND for a nonexistent id', async () => {
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
    const res = mockRes();

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'NOT_FOUND' } });
  });
});

describe('location.controller#update', () => {
  it('AC8 — updates name/code', async () => {
    const loc = await Location.create({ name: 'HQ', code: 'HQ01' });
    const req = { params: { id: loc._id.toString() }, body: { name: 'HQ Updated', code: 'HQ02' } };
    const res = mockRes();

    await controller.update(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].name).toBe('HQ Updated');
  });

  it('AC9 — 409 DUPLICATE_CODE when updating to a code used by a different Location', async () => {
    const locA = await Location.create({ name: 'A', code: 'A1' });
    await Location.create({ name: 'B', code: 'B1' });
    const req = { params: { id: locA._id.toString() }, body: { name: 'A', code: 'B1' } };
    const res = mockRes();

    await controller.update(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('location.controller#setStatus', () => {
  it('AC10 — deactivates a Location with no mapped active Employees', async () => {
    const loc = await Location.create({ name: 'HQ', code: 'HQ01' });
    const req = { params: { id: loc._id.toString() }, body: { isActive: false } };
    const res = mockRes();

    await controller.setStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].isActive).toBe(false);
  });

  it('AC11 — 409 LOCATION_HAS_ACTIVE_EMPLOYEES when an active Employee is mapped', async () => {
    const loc = await Location.create({ name: 'HQ', code: 'HQ01' });
    await mongoose.connection.collection('employees').insertOne({ locationId: loc._id, isActive: true });
    const req = { params: { id: loc._id.toString() }, body: { isActive: false } };
    const res = mockRes();

    await controller.setStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: expect.any(String), code: 'LOCATION_HAS_ACTIVE_EMPLOYEES' },
    });
  });

  it('AC12 — reactivates a deactivated Location', async () => {
    const loc = await Location.create({ name: 'HQ', code: 'HQ01', isActive: false });
    const req = { params: { id: loc._id.toString() }, body: { isActive: true } };
    const res = mockRes();

    await controller.setStatus(req, res);

    expect(res.json.mock.calls[0][0].isActive).toBe(true);
  });
});

describe('location.controller#remove (AC18-AC19)', () => {
  it('AC18 — hard-deletes a Location with no mapped Employees, cascading its LocationDepartment mappings', async () => {
    const loc = await Location.create({ name: 'HQ', code: 'HQ01' });
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    await LocationDepartment.create({ locationId: loc._id, departmentId: dept._id });

    const req = { params: { id: loc._id.toString() } };
    const res = mockRes();
    await controller.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(await Location.findById(loc._id)).toBeNull();
    expect(await LocationDepartment.countDocuments({ locationId: loc._id })).toBe(0);
  });

  it('AC19 — 409 LOCATION_HAS_EMPLOYEES for an inactive (not just active) mapped Employee', async () => {
    const loc = await Location.create({ name: 'HQ', code: 'HQ01' });
    await mongoose.connection.collection('employees').insertOne({ locationId: loc._id, isActive: false });

    const req = { params: { id: loc._id.toString() } };
    const res = mockRes();
    await controller.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'LOCATION_HAS_EMPLOYEES' } });
    expect(await Location.findById(loc._id)).not.toBeNull();
  });

  it('404 NOT_FOUND for a nonexistent id', async () => {
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
    const res = mockRes();
    await controller.remove(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('location.controller Location<->Department mapping', () => {
  it('AC13 — maps a Department to a Location', async () => {
    const loc = await Location.create({ name: 'HQ', code: 'HQ01' });
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    const req = { params: { id: loc._id.toString() }, body: { departmentId: dept._id.toString() } };
    const res = mockRes();

    await controller.mapDepartment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('AC14 — 409 MAPPING_ALREADY_EXISTS for a duplicate mapping', async () => {
    const loc = await Location.create({ name: 'HQ', code: 'HQ01' });
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    await LocationDepartment.create({ locationId: loc._id, departmentId: dept._id });
    const req = { params: { id: loc._id.toString() }, body: { departmentId: dept._id.toString() } };
    const res = mockRes();

    await controller.mapDepartment(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: expect.any(String), code: 'MAPPING_ALREADY_EXISTS' },
    });
  });

  it('AC15 — unmaps a Department from a Location', async () => {
    const loc = await Location.create({ name: 'HQ', code: 'HQ01' });
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    await LocationDepartment.create({ locationId: loc._id, departmentId: dept._id });
    const req = { params: { id: loc._id.toString(), departmentId: dept._id.toString() } };
    const res = mockRes();

    await controller.unmapDepartment(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('AC16 — lists Departments mapped to a Location', async () => {
    const loc = await Location.create({ name: 'HQ', code: 'HQ01' });
    const dept = await Department.create({ name: 'Eng', code: 'ENG' });
    await LocationDepartment.create({ locationId: loc._id, departmentId: dept._id });
    const req = { params: { id: loc._id.toString() } };
    const res = mockRes();

    await controller.listDepartments(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toHaveLength(1);
    expect(res.json.mock.calls[0][0][0].code).toBe('ENG');
  });
});
