const mongoose = require('mongoose');

const STATUSES = [
  'Pending Current Manager Approval',
  'Pending Current HR Approval',
  'Pending Receiving HR Approval',
  'Pending Receiving Manager Approval',
  'Pending Receiving HR Reassignment',
  'Pending Fulfillment Trigger',
  'Pending Fulfillment',
  'Hold',
  'Rejected',
  'Completed',
];

const FULFILLMENT_STATUSES = ['Pending', 'Done', 'Not Applicable', null];

const transferRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    currentLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    currentDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    currentRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    newLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    newDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    newRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    effectiveDate: { type: Date, required: true },
    reason: { type: String, default: null },
    status: { type: String, required: true, enum: STATUSES, default: 'Pending Current Manager Approval' },
    statusEnteredAt: { type: Date, required: true, default: Date.now },
    // Not `required` despite being snapshotted at submission: a Manager- or
    // HR-category Employee legitimately has a null managerId/hrId on their
    // own Employee record (employee-crud-mapping's own mapping rules), so
    // this mirrors that nullability rather than crash on a valid data state
    // the plan's schema sketch didn't anticipate.
    currentManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    currentHrId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    receivingHrId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    receivingManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    rejectedManagerIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }], default: [] },
    rejectionReason: { type: String, default: null },
    holdReason: { type: String, default: null },
    holdStartedAt: { type: Date, default: null },
    payrollStatus: { type: String, enum: FULFILLMENT_STATUSES, default: null },
    itStatus: { type: String, enum: FULFILLMENT_STATUSES, default: null },
    facilitiesStatus: { type: String, enum: FULFILLMENT_STATUSES, default: null },
    escalated: { type: Boolean, default: false },
    escalatedAt: { type: Date, default: null },
    // Set once the Employee's Location/Department/Role/Manager/HR have
    // actually been applied to their Employee record — deferred until
    // `effectiveDate` (see transferRequestWorkflow.service.js#applyDueOrgUpdate),
    // not at Receiving HR's gate-accept moment. Null means still pending
    // (either not yet accepted, or accepted but effectiveDate hasn't arrived).
    orgDataAppliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

transferRequestSchema.index({ employeeId: 1, status: 1 });

// Every controller in this journey does `res.json(transferRequest)` /
// `res.json(requests)` on live documents (unlike employeeAuth.controller.js's
// login, which builds its response object by hand). Mongoose's default
// toJSON only emits `_id`, not `id` — the frontend's TransferRequest type
// expects `id` — so without this transform every endpoint here silently
// omits it and any `${request.id}` on the client resolves to "undefined".
transferRequestSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    return ret;
  },
});

module.exports = mongoose.model('TransferRequest', transferRequestSchema);
module.exports.STATUSES = STATUSES;
