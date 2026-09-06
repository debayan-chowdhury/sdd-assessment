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

describe('jobs.routes', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/v1/admin/jobs/due-org-updates/trigger');
    expect(res.status).toBe(401);
  });

  it('allows a request with a valid Admin token through end to end', async () => {
    const res = await request(app)
      .post('/api/v1/admin/jobs/due-org-updates/trigger')
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ appliedCount: 0 });
  });
});
