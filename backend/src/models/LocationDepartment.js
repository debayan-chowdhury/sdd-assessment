const mongoose = require('mongoose');

const locationDepartmentSchema = new mongoose.Schema(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  },
  { timestamps: true }
);

locationDepartmentSchema.index({ locationId: 1, departmentId: 1 }, { unique: true });

module.exports = mongoose.model('LocationDepartment', locationDepartmentSchema);
