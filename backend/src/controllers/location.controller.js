const mongoose = require('mongoose');
const Location = require('../models/Location');
const LocationDepartment = require('../models/LocationDepartment');
const Department = require('../models/Department');

function validationError(res, message) {
  return res.status(400).json({ error: { message, code: 'VALIDATION_ERROR' } });
}

function notFound(res, message) {
  return res.status(404).json({ error: { message, code: 'NOT_FOUND' } });
}

async function create(req, res) {
  const { name, code } = req.body || {};
  if (!name || !code) {
    return validationError(res, 'name and code are required');
  }

  const existing = await Location.findOne({ code });
  if (existing) {
    return res.status(409).json({ error: { message: 'code already in use', code: 'DUPLICATE_CODE' } });
  }

  const location = await Location.create({ name, code });
  return res.status(201).json(location);
}

async function list(req, res) {
  const filter = {};
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }
  const locations = await Location.find(filter);
  return res.status(200).json(locations);
}

async function getById(req, res) {
  const location = await Location.findById(req.params.id);
  if (!location) {
    return notFound(res, 'Location not found');
  }
  return res.status(200).json(location);
}

async function update(req, res) {
  const { name, code } = req.body || {};
  if (!name || !code) {
    return validationError(res, 'name and code are required');
  }

  const location = await Location.findById(req.params.id);
  if (!location) {
    return notFound(res, 'Location not found');
  }

  const duplicate = await Location.findOne({ code, _id: { $ne: location._id } });
  if (duplicate) {
    return res.status(409).json({ error: { message: 'code already in use', code: 'DUPLICATE_CODE' } });
  }

  location.name = name;
  location.code = code;
  await location.save();
  return res.status(200).json(location);
}

async function setStatus(req, res) {
  const { isActive } = req.body || {};
  const location = await Location.findById(req.params.id);
  if (!location) {
    return notFound(res, 'Location not found');
  }

  if (isActive === false) {
    const activeEmployeeCount = await mongoose.connection
      .collection('employees')
      .countDocuments({ locationId: location._id, isActive: true });
    if (activeEmployeeCount > 0) {
      return res.status(409).json({
        error: { message: 'Location has active employees mapped to it', code: 'LOCATION_HAS_ACTIVE_EMPLOYEES' },
      });
    }
  }

  location.isActive = isActive;
  await location.save();
  return res.status(200).json(location);
}

async function remove(req, res) {
  const location = await Location.findById(req.params.id);
  if (!location) {
    return notFound(res, 'Location not found');
  }

  const employeeCount = await mongoose.connection
    .collection('employees')
    .countDocuments({ locationId: location._id });
  if (employeeCount > 0) {
    return res.status(409).json({
      error: { message: 'One or more Employees are mapped to this Location', code: 'LOCATION_HAS_EMPLOYEES' },
    });
  }

  await LocationDepartment.deleteMany({ locationId: location._id });
  await Location.deleteOne({ _id: location._id });
  return res.status(204).send();
}

async function mapDepartment(req, res) {
  const { departmentId } = req.body || {};
  const location = await Location.findById(req.params.id);
  if (!location) {
    return notFound(res, 'Location not found');
  }
  const department = await Department.findById(departmentId);
  if (!department) {
    return notFound(res, 'Department not found');
  }

  const existing = await LocationDepartment.findOne({ locationId: location._id, departmentId: department._id });
  if (existing) {
    return res.status(409).json({
      error: { message: 'This Location and Department are already mapped', code: 'MAPPING_ALREADY_EXISTS' },
    });
  }

  const mapping = await LocationDepartment.create({ locationId: location._id, departmentId: department._id });
  return res.status(201).json({ locationId: mapping.locationId, departmentId: mapping.departmentId });
}

async function unmapDepartment(req, res) {
  const mapping = await LocationDepartment.findOneAndDelete({
    locationId: req.params.id,
    departmentId: req.params.departmentId,
  });
  if (!mapping) {
    return notFound(res, 'Mapping not found');
  }
  return res.status(204).send();
}

async function listDepartments(req, res) {
  const location = await Location.findById(req.params.id);
  if (!location) {
    return notFound(res, 'Location not found');
  }
  const mappings = await LocationDepartment.find({ locationId: location._id });
  const departments = await Department.find({ _id: { $in: mappings.map((m) => m.departmentId) } });
  return res.status(200).json(departments);
}

module.exports = {
  create,
  list,
  getById,
  update,
  setStatus,
  remove,
  mapDepartment,
  unmapDepartment,
  listDepartments,
};
