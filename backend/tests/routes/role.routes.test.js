const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const { getAdminJwtSecret } = require('../../src/config/adminIdentity');

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

describe('role.routes', () => {
  it('AC17 — rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/roles');
    expect(res.status).toBe(401);
  });

  it('allows a request with a valid token through end to end', async () => {
    const res = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${token()}`)
      .send({ name: 'Manager', code: 'MGR', category: 'Manager' });

    expect(res.status).toBe(201);
    expect(res.body.category).toBe('Manager');
  });

  it('AC19 — DELETE /:id hard-deletes a Role end to end', async () => {
    const createRes = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${token()}`)
      .send({ name: 'Manager', code: 'MGR', category: 'Manager' });

    const deleteRes = await request(app)
      .delete(`/api/v1/roles/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token()}`);

    expect(deleteRes.status).toBe(204);
  });

  it('DELETE /:id rejects an unauthenticated request with 401', async () => {
    const res = await request(app).delete('/api/v1/roles/000000000000000000000000');
    expect(res.status).toBe(401);
  });
});
