const TransferRequest = require('../models/TransferRequest');
const Employee = require('../models/Employee');
const { computeEscalation } = require('../services/transferRequestWorkflow.service');

const ESCALATION_THRESHOLD_DAYS = 2;
const PENDING_STATUS = 'Pending Current HR Approval';
const MIN_TENURE_DAYS = 6 * 30; // 6 months, approximated as 180 days

function computeTenureDays(employee) {
  return (Date.now() - employee.createdAt.getTime()) / (1000 * 60 * 60 * 24);
}

async function listPending(req, res) {
  const requests = await TransferRequest.find({ status: PENDING_STATUS, currentHrId: req.employee.id });
  await Promise.all(requests.map((r) => computeEscalation(r, ESCALATION_THRESHOLD_DAYS)));

  const withTenure = await Promise.all(
    requests.map(async (r) => {
      const employee = await Employee.findById(r.employeeId);
      const tenureDays = employee ? computeTenureDays(employee) : null;
      const plain = r.toJSON();
      plain.employeeTenureDays = tenureDays === null ? null : Math.floor(tenureDays);
      plain.meetsMinimumTenure = tenureDays !== null && tenureDays >= MIN_TENURE_DAYS;
      return plain;
    })
  );

  return res.status(200).json(withTenure);
}

async function decide(req, res) {
  const { decision, reason } = req.body || {};
  if (decision !== 'accept' && decision !== 'reject') {
    return res.status(400).json({ error: { message: 'decision must be accept or reject', code: 'VALIDATION_ERROR' } });
  }

  const transferRequest = await TransferRequest.findById(req.params.id);
  if (!transferRequest) {
    return res.status(404).json({ error: { message: 'TransferRequest not found', code: 'NOT_FOUND' } });
  }
  if (String(transferRequest.currentHrId) !== String(req.employee.id)) {
    return res.status(403).json({ error: { message: 'You are not the assigned Current HR for this request', code: 'FORBIDDEN' } });
  }
  if (transferRequest.status !== PENDING_STATUS) {
    return res.status(409).json({ error: { message: 'This request is not awaiting Current HR approval', code: 'INVALID_STATUS_TRANSITION' } });
  }

  if (decision === 'accept') {
    // The 6-month tenure rule is a warning, not a hard gate: the pending-queue
    // response already surfaces `meetsMinimumTenure`/`employeeTenureDays` so
    // Current HR can be warned client-side before confirming, but accepting
    // an under-tenure Employee is a Current HR judgment call, not blocked here.
    transferRequest.status = 'Pending Receiving HR Approval';
  } else {
    transferRequest.status = 'Rejected';
    transferRequest.rejectionReason = reason || null;
  }
  transferRequest.statusEnteredAt = new Date();
  transferRequest.escalated = false;
  transferRequest.escalatedAt = null;
  await transferRequest.save();

  return res.status(200).json(transferRequest);
}

module.exports = { listPending, decide, computeTenureDays };
