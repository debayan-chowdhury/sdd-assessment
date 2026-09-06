const TransferRequest = require('../models/TransferRequest');
const { findCandidateManagers, computeEscalation } = require('../services/transferRequestWorkflow.service');

const ESCALATION_THRESHOLD_DAYS = 2;
const PENDING_STATUS = 'Pending Receiving Manager Approval';
const REASON_CODES = ['NO_HEADCOUNT', 'ROLE_SKILL_MISMATCH', 'TIMING_CONFLICT', 'OTHER'];

function advanceStatus(transferRequest, status) {
  transferRequest.status = status;
  transferRequest.statusEnteredAt = new Date();
  transferRequest.escalated = false;
  transferRequest.escalatedAt = null;
}

async function listPending(req, res) {
  const requests = await TransferRequest.find({ status: PENDING_STATUS, receivingManagerId: req.employee.id });
  await Promise.all(requests.map((r) => computeEscalation(r, ESCALATION_THRESHOLD_DAYS)));
  return res.status(200).json(requests);
}

async function decide(req, res) {
  const { decision, reasonCode, reasonDetail } = req.body || {};
  if (decision !== 'accept' && decision !== 'reject') {
    return res.status(400).json({ error: { message: 'decision must be accept or reject', code: 'VALIDATION_ERROR' } });
  }
  if (decision === 'reject' && !REASON_CODES.includes(reasonCode)) {
    return res.status(400).json({ error: { message: `reasonCode must be one of ${REASON_CODES.join(', ')}`, code: 'VALIDATION_ERROR' } });
  }

  const transferRequest = await TransferRequest.findById(req.params.id);
  if (!transferRequest) {
    return res.status(404).json({ error: { message: 'TransferRequest not found', code: 'NOT_FOUND' } });
  }
  if (String(transferRequest.receivingManagerId) !== String(req.employee.id)) {
    return res.status(403).json({ error: { message: 'You are not the assigned Receiving Manager for this request', code: 'FORBIDDEN' } });
  }
  if (transferRequest.status !== PENDING_STATUS) {
    return res.status(409).json({ error: { message: 'This request is not awaiting Receiving Manager approval', code: 'INVALID_STATUS_TRANSITION' } });
  }

  if (decision === 'accept') {
    advanceStatus(transferRequest, 'Pending Fulfillment Trigger');
    await transferRequest.save();
    return res.status(200).json(transferRequest);
  }

  transferRequest.rejectedManagerIds.push(transferRequest.receivingManagerId);
  const remaining = await findCandidateManagers(transferRequest.newLocationId, transferRequest.newDepartmentId, transferRequest.rejectedManagerIds);

  if (remaining.length > 0) {
    advanceStatus(transferRequest, 'Pending Receiving HR Reassignment');
  } else {
    transferRequest.holdReason = `${reasonCode}${reasonDetail ? `: ${reasonDetail}` : ''}`;
    transferRequest.holdStartedAt = new Date();
    advanceStatus(transferRequest, 'Hold');
  }
  transferRequest.receivingManagerId = null;
  await transferRequest.save();

  return res.status(200).json(transferRequest);
}

module.exports = { listPending, decide };
