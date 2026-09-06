const { login } = require('../../src/controllers/adminAuth.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('adminAuth.controller#login', () => {
  it('AC1 — returns 200 with a token and the static admin profile on correct credentials', async () => {
    const req = { body: { username: 'admin', password: 'admin' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(typeof payload.token).toBe('string');
    expect(payload.admin).toEqual({
      name: 'Test Admin',
      email: 'admin@example.com',
      phone: '0000000000',
    });
  });

  it('AC2 — returns 401 INVALID_CREDENTIALS on wrong password', async () => {
    const req = { body: { username: 'admin', password: 'wrong' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: expect.any(String), code: 'INVALID_CREDENTIALS' },
    });
  });

  it('AC2 — returns 401 INVALID_CREDENTIALS on wrong username', async () => {
    const req = { body: { username: 'nope', password: 'admin' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: expect.any(String), code: 'INVALID_CREDENTIALS' },
    });
  });

  it('AC3 — returns 400 VALIDATION_ERROR when password is missing', async () => {
    const req = { body: { username: 'admin' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: expect.any(String), code: 'VALIDATION_ERROR' },
    });
  });

  it('AC3 — returns 400 VALIDATION_ERROR on an empty body', async () => {
    const req = { body: {} };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
