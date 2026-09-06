const jwt = require('jsonwebtoken');
const adminAuth = require('../../src/middleware/adminAuth.middleware');
const { getAdminJwtSecret } = require('../../src/config/adminIdentity');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('adminAuth.middleware', () => {
  it('AC4 — calls next() and attaches req.admin for a valid token', () => {
    const token = jwt.sign({ sub: 'admin' }, getAdminJwtSecret(), { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    adminAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.admin.sub).toBe('admin');
    expect(res.status).not.toHaveBeenCalled();
  });

  it('AC5 — returns 401 UNAUTHORIZED when no Authorization header is present', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: expect.any(String), code: 'UNAUTHORIZED' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('AC5 — returns 401 UNAUTHORIZED for a malformed header', () => {
    const req = { headers: { authorization: 'not-a-bearer-token' } };
    const res = mockRes();
    const next = jest.fn();

    adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('AC5 — returns 401 UNAUTHORIZED for an invalid/tampered token', () => {
    const req = { headers: { authorization: 'Bearer not-a-real-jwt' } };
    const res = mockRes();
    const next = jest.fn();

    adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('AC5 — returns 401 UNAUTHORIZED for an expired token', () => {
    const token = jwt.sign({ sub: 'admin' }, getAdminJwtSecret(), { expiresIn: -10 });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
