const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/admin/login', () => {
  it('AC1 — returns 200 with a token and static profile for correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/admin/login')
      .send({ username: 'admin', password: 'admin' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.admin).toEqual({
      name: 'Test Admin',
      email: 'admin@example.com',
      phone: '0000000000',
    });
  });

  it('AC2 — returns 401 INVALID_CREDENTIALS for wrong credentials', async () => {
    const res = await request(app)
      .post('/api/v1/admin/login')
      .send({ username: 'admin', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('AC3 — returns 400 VALIDATION_ERROR for a missing field', async () => {
    const res = await request(app).post('/api/v1/admin/login').send({ username: 'admin' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
