const mongoose = require('mongoose');

const departmentRoleSchema = new mongoose.Schema(
  {
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  },
  { timestamps: true }
);

departmentRoleSchema.index({ departmentId: 1, roleId: 1 }, { unique: true });

module.exports = mongoose.model('DepartmentRole', departmentRoleSchema);
