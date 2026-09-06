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

async function createEmployee() {
  const location = await Location.create({ name: 'HQ', code: 'HQ01' });
  const department = await Department.create({ name: 'Eng', code: 'ENG' });
  const role = await Role.create({ name: 'HR', code: 'HR1', category: 'HR' });
  const passwordHash = await bcrypt.hash('correct-password', 4);
  return Employee.create({ name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: role._id, passwordHash });
}

describe('auth.routes', () => {
  it('POST /login is reachable without a token and returns 200 on correct credentials', async () => {
    await createEmployee();
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'e1@example.com', password: 'correct-password' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  it('AC8 — POST /change-password rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/v1/auth/change-password').send({ currentPassword: 'a', newPassword: 'b' });
    expect(res.status).toBe(401);
  });

  it('AC11 — GET /profile rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/auth/profile');
    expect(res.status).toBe(401);
  });

  it('AC10 — GET /profile returns the caller\'s own resolved profile end to end', async () => {
    await createEmployee();
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'e1@example.com', password: 'correct-password' });

    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('E');
    expect(res.body.locationName).toBe('HQ');
    expect(res.body.departmentName).toBe('Eng');
    expect(res.body.roleName).toBe('HR');
  });

  it('allows change-password through end to end with a valid token', async () => {
    await createEmployee();
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'e1@example.com', password: 'correct-password' });

    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({ currentPassword: 'correct-password', newPassword: 'new-pass' });

    expect(res.status).toBe(200);
  });
});
