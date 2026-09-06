function getEmployeeJwtSecret() {
  return process.env.EMPLOYEE_JWT_SECRET || 'dev-only-insecure-secret';
}

module.exports = { getEmployeeJwtSecret };
