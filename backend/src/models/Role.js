const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, default: true },
    category: { type: String, enum: ['HR', 'Manager', 'Payroll', 'IT', 'Facilities', null], default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
