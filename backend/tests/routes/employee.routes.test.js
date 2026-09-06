const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const { getAdminJwtSecret } = require('../../src/config/adminIdentity');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');

const token = () => jwt.sign({ sub: 'admin' }, getAdminJwtSecret(), { expiresIn: '1h' });

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnect();
});

describe('employee.routes', () => {
  it('AC18 — rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/employees');
    expect(res.status).toBe(401);
  });

  it('allows a request with a valid token through end to end', async () => {
    const location = await Location.create({ name: 'HQ', code: 'HQ01' });
    const department = await Department.create({ name: 'Eng', code: 'ENG' });
    const hrRole = await Role.create({ name: 'HR', code: 'HR1', category: 'HR' });

    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        name: 'Jane',
        email: 'jane@example.com',
        password: 'jane-pass',
        locationId: location._id.toString(),
        departmentId: department._id.toString(),
        roleId: hrRole._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('jane@example.com');
  });

  it('AC22 — DELETE /:id hard-deletes an Employee end to end', async () => {
    const location = await Location.create({ name: 'HQ', code: 'HQ01' });
    const department = await Department.create({ name: 'Eng', code: 'ENG' });
    const hrRole = await Role.create({ name: 'HR', code: 'HR1', category: 'HR' });

    const createRes = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        name: 'Jane',
        email: 'jane@example.com',
        password: 'jane-pass',
        locationId: location._id.toString(),
        departmentId: department._id.toString(),
        roleId: hrRole._id.toString(),
      });

    const deleteRes = await request(app)
      .delete(`/api/v1/employees/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token()}`);

    expect(deleteRes.status).toBe(204);
  });

  it('DELETE /:id rejects an unauthenticated request with 401', async () => {
    const res = await request(app).delete('/api/v1/employees/000000000000000000000000');
    expect(res.status).toBe(401);
  });
});
