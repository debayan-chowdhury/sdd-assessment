const jwt = require('jsonwebtoken');
const { getAdminJwtSecret } = require('../config/adminIdentity');

function adminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: { message: 'Missing or malformed Authorization header', code: 'UNAUTHORIZED' },
    });
  }

  try {
    req.admin = jwt.verify(token, getAdminJwtSecret());
    return next();
  } catch (err) {
    return res.status(401).json({
      error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' },
    });
  }
}

module.exports = adminAuth;
