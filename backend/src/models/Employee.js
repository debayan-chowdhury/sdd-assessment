const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    isActive: { type: Boolean, default: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    hrId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    // `default` exists only so a document created without going through
    // employee.controller.js#create (e.g. a manager/HR fixture built directly
    // via the model in a test) still satisfies `required`. The real create
    // endpoint always passes its own bcrypt hash explicitly, overriding this.
    passwordHash: { type: String, required: true, select: false, default: () => bcrypt.hashSync('unset', 4) },
    mustChangePassword: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
