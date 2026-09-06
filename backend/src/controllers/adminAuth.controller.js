const jwt = require('jsonwebtoken');
const { getAdminIdentity, getAdminJwtSecret } = require('../config/adminIdentity');

const TOKEN_EXPIRY = '8h';

async function login(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      error: { message: 'username and password are required', code: 'VALIDATION_ERROR' },
    });
  }

  const identity = getAdminIdentity();

  if (username !== identity.username || password !== identity.password) {
    return res.status(401).json({
      error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
    });
  }

  const token = jwt.sign({ sub: 'admin', username }, getAdminJwtSecret(), {
    expiresIn: TOKEN_EXPIRY,
  });

  return res.status(200).json({ token, admin: identity.profile });
}

module.exports = { login };
