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

describe('location.routes', () => {
  it('AC17 — rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/locations');
    expect(res.status).toBe(401);
  });

  it('allows a request with a valid token through end to end', async () => {
    const res = await request(app)
      .post('/api/v1/locations')
      .set('Authorization', `Bearer ${token()}`)
      .send({ name: 'HQ', code: 'HQ01' });

    expect(res.status).toBe(201);
    expect(res.body.code).toBe('HQ01');
  });

  it('AC18 — DELETE /:id hard-deletes a Location end to end', async () => {
    const createRes = await request(app)
      .post('/api/v1/locations')
      .set('Authorization', `Bearer ${token()}`)
      .send({ name: 'HQ', code: 'HQ01' });

    const deleteRes = await request(app)
      .delete(`/api/v1/locations/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token()}`);

    expect(deleteRes.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/v1/locations/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token()}`);
    expect(getRes.status).toBe(404);
  });

  it('DELETE /:id rejects an unauthenticated request with 401', async () => {
    const res = await request(app).delete('/api/v1/locations/000000000000000000000000');
    expect(res.status).toBe(401);
  });
});
