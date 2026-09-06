const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const Employee = require('../../src/models/Employee');
const employeeAuth = require('../../src/middleware/employeeAuth.middleware');
const { getEmployeeJwtSecret } = require('../../src/config/employeeAuth');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnect();
});

async function createEmployee() {
  const location = await Location.create({ name: 'HQ', code: 'HQ01' });
  const department = await Department.create({ name: 'Eng', code: 'ENG' });
  const role = await Role.create({ name: 'Payroll', code: 'PAY1', category: 'Payroll' });
  const passwordHash = await bcrypt.hash('pass', 4);
  return Employee.create({ name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: role._id, passwordHash });
}

describe('employeeAuth.middleware (AC8)', () => {
  it('calls next() and attaches req.employee with current roleCategory for a valid token', async () => {
    const employee = await createEmployee();
    const token = jwt.sign({ sub: employee._id.toString() }, getEmployeeJwtSecret());
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    await employeeAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.employee.id).toBe(employee._id.toString());
    expect(req.employee.roleCategory).toBe('Payroll');
  });

  it('returns 401 UNAUTHORIZED when no Authorization header is present', async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await employeeAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 UNAUTHORIZED for an invalid/tampered token', async () => {
    const req = { headers: { authorization: 'Bearer not-a-real-jwt' } };
    const res = mockRes();
    const next = jest.fn();

    await employeeAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 UNAUTHORIZED when the token references a since-deleted Employee', async () => {
    const employee = await createEmployee();
    const token = jwt.sign({ sub: employee._id.toString() }, getEmployeeJwtSecret());
    await Employee.deleteOne({ _id: employee._id });

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    await employeeAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
