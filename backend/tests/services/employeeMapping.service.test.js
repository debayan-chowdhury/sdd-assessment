const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const Employee = require('../../src/models/Employee');
const { validateEmployeeMapping } = require('../../src/services/employeeMapping.service');

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnect();
});

async function setupBase() {
  const location = await Location.create({ name: 'HQ', code: 'HQ01' });
  const department = await Department.create({ name: 'Eng', code: 'ENG' });
  const managerRole = await Role.create({ name: 'Manager', code: 'MGR', category: 'Manager' });
  const hrRole = await Role.create({ name: 'HR', code: 'HR1', category: 'HR' });
  const regularRole = await Role.create({ name: 'Staff', code: 'STF' });
  return { location, department, managerRole, hrRole, regularRole };
}

describe('employeeMapping.service — role-category requirements (AC1-6)', () => {
  it('AC1 — regular Employee with both manager and hr passes', async () => {
    const { location, department, managerRole, hrRole, regularRole } = await setupBase();
    const manager = await Employee.create({
      name: 'Mgr', email: 'mgr-e1@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id,
    });
    const hr = await Employee.create({
      name: 'HR', email: 'hr-e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id,
    });

    const result = await validateEmployeeMapping({
      locationId: location._id, departmentId: department._id, roleId: regularRole._id,
      managerId: manager._id, hrId: hr._id,
    });

    expect(result).toBeNull();
  });

  it('AC2 — Manager-category Employee with only hr passes', async () => {
    const { location, department, hrRole, managerRole } = await setupBase();
    const hr = await Employee.create({
      name: 'HR', email: 'hr-e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id,
    });

    const result = await validateEmployeeMapping({
      locationId: location._id, departmentId: department._id, roleId: managerRole._id,
      managerId: null, hrId: hr._id,
    });

    expect(result).toBeNull();
  });

  it('AC3 — HR-category Employee with no mappings passes', async () => {
    const { location, department, hrRole } = await setupBase();

    const result = await validateEmployeeMapping({
      locationId: location._id, departmentId: department._id, roleId: hrRole._id,
      managerId: null, hrId: null,
    });

    expect(result).toBeNull();
  });

  it('AC4 — regular Employee missing managerId returns MANAGER_REQUIRED', async () => {
    const { location, department, hrRole, regularRole } = await setupBase();
    const hr = await Employee.create({
      name: 'HR', email: 'hr-e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id,
    });

    const result = await validateEmployeeMapping({
      locationId: location._id, departmentId: department._id, roleId: regularRole._id,
      managerId: null, hrId: hr._id,
    });

    expect(result).toMatchObject({ status: 400, code: 'MANAGER_REQUIRED' });
  });

  it('AC5 — Manager-category Employee missing hrId returns HR_REQUIRED', async () => {
    const { location, department, managerRole } = await setupBase();

    const result = await validateEmployeeMapping({
      locationId: location._id, departmentId: department._id, roleId: managerRole._id,
      managerId: null, hrId: null,
    });

    expect(result).toMatchObject({ status: 400, code: 'HR_REQUIRED' });
  });

  it('AC6 — HR-category Employee with a managerId provided returns MAPPING_NOT_ALLOWED', async () => {
    const { location, department, hrRole, managerRole } = await setupBase();
    const manager = await Employee.create({
      name: 'Mgr', email: 'mgr-e1@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id,
    });

    const result = await validateEmployeeMapping({
      locationId: location._id, departmentId: department._id, roleId: hrRole._id,
      managerId: manager._id, hrId: null,
    });

    expect(result).toMatchObject({ status: 400, code: 'MAPPING_NOT_ALLOWED' });
  });
});

describe('employeeMapping.service — manager/hr integrity (AC7-10)', () => {
  it('AC7 — nonexistent managerId returns MANAGER_NOT_FOUND', async () => {
    const { location, department, regularRole, hrRole } = await setupBase();
    const hr = await Employee.create({
      name: 'HR', email: 'hr-e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id,
    });

    const result = await validateEmployeeMapping({
      locationId: location._id, departmentId: department._id, roleId: regularRole._id,
      managerId: new mongoose.Types.ObjectId(), hrId: hr._id,
    });

    expect(result).toMatchObject({ status: 404, code: 'MANAGER_NOT_FOUND' });
  });

  it('AC8 — managerId referencing a non-Manager-category Employee returns INVALID_MANAGER_ROLE', async () => {
    const { location, department, regularRole, hrRole } = await setupBase();
    const notAManager = await Employee.create({
      name: 'X', email: 'x1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id,
    });
    const hr = await Employee.create({
      name: 'HR', email: 'hr-e1@example.com', locationId: location._id, departmentId: department._id, roleId: hrRole._id,
    });

    const result = await validateEmployeeMapping({
      locationId: location._id, departmentId: department._id, roleId: regularRole._id,
      managerId: notAManager._id, hrId: hr._id,
    });

    expect(result).toMatchObject({ status: 400, code: 'INVALID_MANAGER_ROLE' });
  });

  it('AC9 — hrId referencing a non-HR-category Employee returns INVALID_HR_ROLE', async () => {
    const { location, department, regularRole, managerRole } = await setupBase();
    const manager = await Employee.create({
      name: 'Mgr', email: 'mgr-e1@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id,
    });
    const notHr = await Employee.create({
      name: 'X', email: 'x1@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id,
    });

    const result = await validateEmployeeMapping({
      locationId: location._id, departmentId: department._id, roleId: regularRole._id,
      managerId: manager._id, hrId: notHr._id,
    });

    expect(result).toMatchObject({ status: 400, code: 'INVALID_HR_ROLE' });
  });

  it('AC10 — hrId in a different Department returns MAPPING_SCOPE_MISMATCH', async () => {
    const { location, department, regularRole, managerRole, hrRole } = await setupBase();
    const otherDepartment = await Department.create({ name: 'Sales', code: 'SAL' });
    const manager = await Employee.create({
      name: 'Mgr', email: 'mgr-e1@example.com', locationId: location._id, departmentId: department._id, roleId: managerRole._id,
    });
    const hrElsewhere = await Employee.create({
      name: 'HR', email: 'hr-e1@example.com', locationId: location._id, departmentId: otherDepartment._id, roleId: hrRole._id,
    });

    const result = await validateEmployeeMapping({
      locationId: location._id, departmentId: department._id, roleId: regularRole._id,
      managerId: manager._id, hrId: hrElsewhere._id,
    });

    expect(result).toMatchObject({ status: 400, code: 'MAPPING_SCOPE_MISMATCH' });
  });
});
