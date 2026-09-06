const Location = require('../models/Location');
const Department = require('../models/Department');
const Role = require('../models/Role');
const Employee = require('../models/Employee');

function err(status, code, message) {
  return { status, code, message };
}

async function validateReferences({ locationId, departmentId, roleId }) {
  const [location, department, role] = await Promise.all([
    Location.findById(locationId),
    Department.findById(departmentId),
    Role.findById(roleId),
  ]);

  if (!location) return { error: err(404, 'NOT_FOUND', 'locationId does not reference an existing Location') };
  if (!department) return { error: err(404, 'NOT_FOUND', 'departmentId does not reference an existing Department') };
  if (!role) return { error: err(404, 'NOT_FOUND', 'roleId does not reference an existing Role') };

  return { role };
}

function validateRoleCategoryRequirement(role, managerId, hrId) {
  if (role.category === null || role.category === undefined) {
    if (!managerId) return err(400, 'MANAGER_REQUIRED', 'A regular Employee requires a managerId');
    if (!hrId) return err(400, 'HR_REQUIRED', 'A regular Employee requires an hrId');
    return null;
  }

  if (role.category === 'Manager') {
    if (!hrId) return err(400, 'HR_REQUIRED', 'A Manager-category Employee requires an hrId');
    return null;
  }

  if (role.category === 'HR') {
    if (managerId || hrId) {
      return err(400, 'MAPPING_NOT_ALLOWED', 'An HR-category Employee cannot have a managerId or hrId');
    }
    return null;
  }

  return null;
}

async function validateReferencedEmployee({ id, expectedCategory, notFoundCode, invalidRoleCode, locationId, departmentId }) {
  const employee = await Employee.findById(id);
  if (!employee) {
    return err(404, notFoundCode, `${notFoundCode === 'MANAGER_NOT_FOUND' ? 'managerId' : 'hrId'} does not reference an existing Employee`);
  }

  const role = await Role.findById(employee.roleId);
  if (!role || role.category !== expectedCategory) {
    return err(400, invalidRoleCode, `The referenced Employee does not hold a Role with category "${expectedCategory}"`);
  }

  if (String(employee.locationId) !== String(locationId) || String(employee.departmentId) !== String(departmentId)) {
    return err(400, 'MAPPING_SCOPE_MISMATCH', 'The referenced Employee is not in the same Location+Department');
  }

  return null;
}

async function validateEmployeeMapping({ locationId, departmentId, roleId, managerId, hrId }) {
  const { error: refError, role } = await validateReferences({ locationId, departmentId, roleId });
  if (refError) return refError;

  const requirementError = validateRoleCategoryRequirement(role, managerId, hrId);
  if (requirementError) return requirementError;

  if (managerId) {
    const managerError = await validateReferencedEmployee({
      id: managerId,
      expectedCategory: 'Manager',
      notFoundCode: 'MANAGER_NOT_FOUND',
      invalidRoleCode: 'INVALID_MANAGER_ROLE',
      locationId,
      departmentId,
    });
    if (managerError) return managerError;
  }

  if (hrId) {
    const hrError = await validateReferencedEmployee({
      id: hrId,
      expectedCategory: 'HR',
      notFoundCode: 'HR_NOT_FOUND',
      invalidRoleCode: 'INVALID_HR_ROLE',
      locationId,
      departmentId,
    });
    if (hrError) return hrError;
  }

  return null;
}

module.exports = { validateEmployeeMapping };
