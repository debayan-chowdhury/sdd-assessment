const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const Employee = require('../../src/models/Employee');

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnect();
});

async function loginToken() {
  const location = await Location.create({ name: 'Delhi', code: 'DEL' });
  const department = await Department.create({ name: 'Eng', code: 'ENG' });
  const role = await Role.create({ name: 'Staff', code: 'STF' });
  const passwordHash = await bcrypt.hash('pass', 4);
  await Employee.create({
    name: 'S',
    email: 's1@example.com',
    locationId: location._id,
    departmentId: department._id,
    roleId: role._id,
    passwordHash,
  });

  const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 's1@example.com', password: 'pass' });
  return loginRes.body.token;
}

describe('options.routes', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/options/locations');
    expect(res.status).toBe(401);
  });

  it('lists only active Locations for a valid Employee token', async () => {
    const token = await loginToken();
    await Location.create({ name: 'Mumbai', code: 'MUM' });
    await Location.create({ name: 'Inactive', code: 'INA', isActive: false });

    const res = await request(app).get('/api/v1/options/locations').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const names = res.body.map((l) => l.name);
    expect(names).toContain('Delhi');
    expect(names).toContain('Mumbai');
    expect(names).not.toContain('Inactive');
  });

  it('departments — with no locationId, lists every active Department unfiltered', async () => {
    const token = await loginToken();
    await Department.create({ name: 'Unstaffed', code: 'UNS' });
    await Department.create({ name: 'Inactive', code: 'IND', isActive: false });

    const res = await request(app).get('/api/v1/options/departments').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const names = res.body.map((d) => d.name);
    expect(names).toContain('Unstaffed');
    expect(names).not.toContain('Inactive');
  });

  it('departments — lists only Departments with both an active HR and an active Manager Employee at the given Location', async () => {
    const token = await loginToken();
    const location = await Location.create({ name: 'Mumbai', code: 'MUM' });
    const staffedDept = await Department.create({ name: 'Fully Staffed', code: 'FST' });
    const hrOnlyDept = await Department.create({ name: 'HR Only', code: 'HRO' });
    const inactiveDept = await Department.create({ name: 'Inactive Staffed', code: 'IST', isActive: false });
    const hrRole = await Role.create({ name: 'HR Exec', code: 'HRX', category: 'HR' });
    const managerRole = await Role.create({ name: 'Mgr', code: 'MGX', category: 'Manager' });

    await Employee.create({ name: 'HR1', email: 'hr1@example.com', locationId: location._id, departmentId: staffedDept._id, roleId: hrRole._id });
    await Employee.create({ name: 'Mgr1', email: 'mgr1@example.com', locationId: location._id, departmentId: staffedDept._id, roleId: managerRole._id });
    await Employee.create({ name: 'HR2', email: 'hr2@example.com', locationId: location._id, departmentId: hrOnlyDept._id, roleId: hrRole._id });
    await Employee.create({ name: 'HR3', email: 'hr3@example.com', locationId: location._id, departmentId: inactiveDept._id, roleId: hrRole._id });
    await Employee.create({ name: 'Mgr3', email: 'mgr3@example.com', locationId: location._id, departmentId: inactiveDept._id, roleId: managerRole._id });

    const res = await request(app)
      .get('/api/v1/options/departments')
      .query({ locationId: location._id.toString() })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const names = res.body.map((d) => d.name);
    expect(names).toEqual(['Fully Staffed']);
  });

  it('departments — an inactive Employee does not count toward HR/Manager staffing', async () => {
    const token = await loginToken();
    const location = await Location.create({ name: 'Pune', code: 'PUN' });
    const department = await Department.create({ name: 'Ops', code: 'OPS' });
    const hrRole = await Role.create({ name: 'HR Exec', code: 'HRX2', category: 'HR' });
    const managerRole = await Role.create({ name: 'Mgr', code: 'MGX2', category: 'Manager' });

    await Employee.create({ name: 'HR1', email: 'hr4@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });
    await Employee.create({
      name: 'Mgr1', email: 'mgr4@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id, isActive: false,
    });

    const res = await request(app)
      .get('/api/v1/options/departments')
      .query({ locationId: location._id.toString() })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('lists only active Roles for a valid Employee token', async () => {
    const token = await loginToken();
    await Role.create({ name: 'Inactive Role', code: 'INR', isActive: false });

    const res = await request(app).get('/api/v1/options/roles').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const names = res.body.map((r) => r.name);
    expect(names).toContain('Staff');
    expect(names).not.toContain('Inactive Role');
  });

  it('roles — excludes Manager/HR/IT/Payroll/Facilities category Roles', async () => {
    const token = await loginToken();
    await Role.create({ name: 'Mgr Role', code: 'MGRX', category: 'Manager' });
    await Role.create({ name: 'HR Role', code: 'HRXY', category: 'HR' });
    await Role.create({ name: 'IT Role', code: 'ITXY', category: 'IT' });
    await Role.create({ name: 'Payroll Role', code: 'PAYX', category: 'Payroll' });
    await Role.create({ name: 'Facilities Role', code: 'FACX', category: 'Facilities' });

    const res = await request(app).get('/api/v1/options/roles').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const names = res.body.map((r) => r.name);
    expect(names).toEqual(['Staff']);
  });

  it('employees — rejects a request with no ids with 400', async () => {
    const token = await loginToken();

    const res = await request(app).get('/api/v1/options/employees').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('employees — resolves names for the requested ids only, name+id only', async () => {
    const token = await loginToken();
    const location = await Location.create({ name: 'Mumbai', code: 'MUM' });
    const department = await Department.create({ name: 'Eng2', code: 'ENG2' });
    const role = await Role.create({ name: 'Staff2', code: 'STF2' });
    const target = await Employee.create({
      name: 'Target Employee', email: 'target@example.com', locationId: location._id, departmentId: department._id, roleId: role._id,
    });
    const other = await Employee.create({
      name: 'Other Employee', email: 'other@example.com', locationId: location._id, departmentId: department._id, roleId: role._id,
    });

    const res = await request(app)
      .get('/api/v1/options/employees')
      .query({ ids: target._id.toString() })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Target Employee');
    expect(res.body[0].email).toBeUndefined();
    expect(res.body.map((e) => e.id || e._id)).not.toContain(other._id.toString());
  });

  it('managers — rejects a request missing locationId or departmentId with 400', async () => {
    const token = await loginToken();

    const res = await request(app).get('/api/v1/options/managers').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('managers — lists only active Manager-category Employees at the given Location+Department', async () => {
    const token = await loginToken();
    const location = await Location.create({ name: 'Pune2', code: 'PUN2' });
    const department = await Department.create({ name: 'Ops2', code: 'OPS2' });
    const managerRole = await Role.create({ name: 'Mgr2', code: 'MGX3', category: 'Manager' });
    const staffRole = await Role.create({ name: 'Staff3', code: 'STF3' });

    const manager = await Employee.create({
      name: 'Mgr Active', email: 'mgra@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id,
    });
    await Employee.create({
      name: 'Mgr Inactive', email: 'mgri@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id, isActive: false,
    });
    await Employee.create({
      name: 'Not A Manager', email: 'nam@example.com', locationId: location._id, departmentId: department._id, roleId: staffRole._id,
    });

    const res = await request(app)
      .get('/api/v1/options/managers')
      .query({ locationId: location._id.toString(), departmentId: department._id.toString() })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const names = res.body.map((m) => m.name);
    expect(names).toEqual(['Mgr Active']);
    expect(res.body[0].id || res.body[0]._id.toString()).toBe(manager._id.toString());
  });
});
