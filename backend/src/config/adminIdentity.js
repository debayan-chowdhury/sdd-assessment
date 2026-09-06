function getAdminIdentity() {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin',
    profile: {
      name: process.env.ADMIN_NAME || 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      phone: process.env.ADMIN_PHONE || '0000000000',
    },
  };
}

function getAdminJwtSecret() {
  return process.env.ADMIN_JWT_SECRET || 'dev-only-insecure-secret';
}

module.exports = { getAdminIdentity, getAdminJwtSecret };
