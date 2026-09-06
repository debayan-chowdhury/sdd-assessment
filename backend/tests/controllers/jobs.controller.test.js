const { connect, clearDatabase, disconnect } = require('../helpers/db');
const Location = require('../../src/models/Location');
const Department = require('../../src/models/Department');
const Role = require('../../src/models/Role');
const Employee = require('../../src/models/Employee');
const TransferRequest = require('../../src/models/TransferRequest');
const controller = require('../../src/controllers/jobs.controller');

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

describe('jobs.controller#triggerDueOrgUpdates', () => {
  it('applies due updates and returns the count', async () => {
    const location = await Location.create({ name: 'HQ', code: 'HQ01' });
    const newLocation = await Location.create({ name: 'Mumbai', code: 'BOM' });
    const department = await Department.create({ name: 'Eng', code: 'ENG' });
    const staffRole = await Role.create({ name: 'Staff', code: 'STF' });
    const managerRole = await Role.create({ name: 'Manager', code: 'MGR', category: 'Manager' });
    const hrRole = await Role.create({ name: 'HR', code: 'HR1', category: 'HR' });
    const manager = await Employee.create({ name: 'M', email: 'm1@example.com', locationId: newLocation._id, departmentId: department._id, roleId: managerRole._id });
    const hr = await Employee.create({ name: 'H', email: 'h1@example.com', locationId: newLocation._id, departmentId: department._id, roleId: hrRole._id });
    const employee = await Employee.create({ name: 'E', email: 'e1@example.com', locationId: location._id, departmentId: department._id, roleId: staffRole._id });

    await TransferRequest.create({
      employeeId: employee._id,
      currentLocationId: location._id,
      currentDepartmentId: department._id,
      currentRoleId: staffRole._id,
      newLocationId: newLocation._id,
      newDepartmentId: department._id,
      newRoleId: staffRole._id,
      effectiveDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'Pending Receiving Manager Approval',
      receivingHrId: hr._id,
      receivingManagerId: manager._id,
    });

    const res = mockRes();
    await controller.triggerDueOrgUpdates({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ appliedCount: 1 });

    const updatedEmployee = await Employee.findById(employee._id);
    expect(updatedEmployee.locationId.toString()).toBe(newLocation._id.toString());
  });

  it('returns appliedCount: 0 when nothing is due', async () => {
    const res = mockRes();
    await controller.triggerDueOrgUpdates({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ appliedCount: 0 });
  });
});
