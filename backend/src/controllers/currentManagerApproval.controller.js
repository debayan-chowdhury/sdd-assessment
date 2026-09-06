const TransferRequest = require('../models/TransferRequest');
const { computeEscalation } = require('../services/transferRequestWorkflow.service');

const ESCALATION_THRESHOLD_DAYS = 2;
const PENDING_STATUS = 'Pending Current Manager Approval';

async function listPending(req, res) {
  const requests = await TransferRequest.find({ status: PENDING_STATUS, currentManagerId: req.employee.id });
  await Promise.all(requests.map((r) => computeEscalation(r, ESCALATION_THRESHOLD_DAYS)));
  return res.status(200).json(requests);
}

async function decide(req, res) {
  const { decision, reason } = req.body || {};
  if (decision !== 'accept' && decision !== 'reject') {
    return res.status(400).json({ error: { message: 'decision must be accept or reject', code: 'VALIDATION_ERROR' } });
  }
  if (decision === 'reject' && !reason) {
    return res.status(400).json({ error: { message: 'reason is required to reject', code: 'REASON_REQUIRED' } });
  }

  const transferRequest = await TransferRequest.findById(req.params.id);
  if (!transferRequest) {
    return res.status(404).json({ error: { message: 'TransferRequest not found', code: 'NOT_FOUND' } });
  }
  if (String(transferRequest.currentManagerId) !== String(req.employee.id)) {
    return res.status(403).json({ error: { message: 'You are not the assigned Current Manager for this request', code: 'FORBIDDEN' } });
  }
  if (transferRequest.status !== PENDING_STATUS) {
    return res.status(409).json({ error: { message: 'This request is not awaiting Current Manager approval', code: 'INVALID_STATUS_TRANSITION' } });
  }

  if (decision === 'accept') {
    transferRequest.status = 'Pending Current HR Approval';
  } else {
    transferRequest.status = 'Rejected';
    transferRequest.rejectionReason = reason;
  }
  transferRequest.statusEnteredAt = new Date();
  transferRequest.escalated = false;
  transferRequest.escalatedAt = null;
  await transferRequest.save();

  return res.status(200).json(transferRequest);
}

module.exports = { listPending, decide };
