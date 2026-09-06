const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const DepartmentRole = require('../../src/models/DepartmentRole');
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

describe('transferRequest.routes', () => {
  it('AC9 — rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/v1/transfer-requests').send({});
    expect(res.status).toBe(401);
  });

  it('allows a request with a valid Employee token through end to end', async () => {
    const location = await Location.create({ name: 'Delhi', code: 'DEL' });
    const department = await Department.create({ name: 'Eng', code: 'ENG' });
    const newDepartment = await Department.create({ name: 'Sales', code: 'SAL' });
    const regularRole = await Role.create({ name: 'Staff', code: 'STF' });
    const managerRole = await Role.create({ name: 'Manager', code: 'MGR', category: 'Manager' });
    const hrRole = await Role.create({ name: 'HR', code: 'HR1', category: 'HR' });
    await DepartmentRole.create([
      { departmentId: department._id, roleId: regularRole._id },
      { departmentId: department._id, roleId: managerRole._id },
      { departmentId: department._id, roleId: hrRole._id },
      { departmentId: newDepartment._id, roleId: regularRole._id },
    ]);
    const manager = await Employee.create({ name: 'M', email: 'm1@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id });
    const hr = await Employee.create({ name: 'H', email: 'h1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id });
    await Employee.create({ name: 'RHR', email: 'rhr1@example.com', locationId: location._id, departmentId: newDepartment._id, roleId: hrRole._id });
    const passwordHash = await bcrypt.hash('pass', 4);
    const submitter = await Employee.create({ name: 'S', email: 's1@example.com', locationId: location._id, departmentId: department._id, roleId: regularRole._id, managerId: manager._id, hrId: hr._id, passwordHash });

    const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 's1@example.com', password: 'pass' });

    const res = await request(app)
      .post('/api/v1/transfer-requests')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({ newLocationId: location._id, newDepartmentId: newDepartment._id, newRoleId: regularRole._id, effectiveDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString() });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Pending Current Manager Approval');
    // Regression: the frontend consumes `id`, not `_id` — the create response,
    // and every other endpoint returning a TransferRequest, must include it.
    expect(res.body.id).toBeDefined();
    expect(res.body.id).toBe(res.body._id);

    const listRes = await request(app)
      .get('/api/v1/transfer-requests/pending/current-manager')
      .set('Authorization', `Bearer ${await loginToken(manager, 'pass')}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body[0].id).toBe(res.body.id);
  });
});

async function loginToken(employee, password) {
  const passwordHash = await bcrypt.hash(password, 4);
  employee.passwordHash = passwordHash;
  await employee.save();
  const res = await request(app).post('/api/v1/auth/login').send({ email: employee.email, password });
  return res.body.token;
}
