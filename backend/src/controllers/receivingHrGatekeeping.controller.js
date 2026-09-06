const TransferRequest = require('../models/TransferRequest');
const { validateManagerAssignment } = require('../services/transferRequestWorkflow.service');

const HOLD_WINDOW_MONTHS = 6;

function notFoundOrForbidden(req, res, transferRequest) {
  if (!transferRequest) {
    res.status(404).json({ error: { message: 'TransferRequest not found', code: 'NOT_FOUND' } });
    return true;
  }
  if (String(transferRequest.receivingHrId) !== String(req.employee.id)) {
    res.status(403).json({ error: { message: 'You are not the assigned Receiving HR for this request', code: 'FORBIDDEN' } });
    return true;
  }
  return false;
}

function advanceStatus(transferRequest, status) {
  transferRequest.status = status;
  transferRequest.statusEnteredAt = new Date();
  transferRequest.escalated = false;
  transferRequest.escalatedAt = null;
}

async function listGatePending(req, res) {
  const requests = await TransferRequest.find({ status: 'Pending Receiving HR Approval', receivingHrId: req.employee.id });
  return res.status(200).json(requests);
}

// Neither of these two GETs was part of the original backend API contract —
// AC12 (reassign after a Receiving Manager rejects) and AC13/AC14 (reopen a
// Hold) both need a way to list the requests currently awaiting that action,
// scoped to the caller as receivingHrId, same as every other queue here.
async function listReassignmentPending(req, res) {
  const requests = await TransferRequest.find({ status: 'Pending Receiving HR Reassignment', receivingHrId: req.employee.id });
  return res.status(200).json(requests);
}

async function listHoldPending(req, res) {
  const requests = await TransferRequest.find({ status: 'Hold', receivingHrId: req.employee.id });
  return res.status(200).json(requests);
}

async function gateDecision(req, res) {
  const { decision, assignedManagerId, reason } = req.body || {};
  if (decision !== 'accept' && decision !== 'reject') {
    return res.status(400).json({ error: { message: 'decision must be accept or reject', code: 'VALIDATION_ERROR' } });
  }
  if (decision === 'accept' && !assignedManagerId) {
    return res.status(400).json({ error: { message: 'assignedManagerId is required to accept', code: 'VALIDATION_ERROR' } });
  }

  const transferRequest = await TransferRequest.findById(req.params.id);
  if (notFoundOrForbidden(req, res, transferRequest)) return undefined;
  if (transferRequest.status !== 'Pending Receiving HR Approval') {
    return res.status(409).json({ error: { message: 'This request is not awaiting the Receiving HR gate', code: 'INVALID_STATUS_TRANSITION' } });
  }

  if (decision === 'reject') {
    transferRequest.rejectionReason = reason || null;
    advanceStatus(transferRequest, 'Rejected');
    await transferRequest.save();
    return res.status(200).json(transferRequest);
  }

  const { error, manager } = await validateManagerAssignment(assignedManagerId, transferRequest.newLocationId, transferRequest.newDepartmentId);
  if (error) {
    return res.status(error.status).json({ error: { message: error.message, code: error.code } });
  }

  // The Employee's own Location/Department/Role/Manager/HR are NOT updated
  // here — only on/after `effectiveDate` (see
  // transferRequestWorkflow.service.js#applyDueOrgUpdate). Setting
  // receivingManagerId is what marks this request as "accepted, org update
  // pending" for that deferred application.
  transferRequest.receivingManagerId = manager._id;
  advanceStatus(transferRequest, 'Pending Receiving Manager Approval');
  await transferRequest.save();

  return res.status(200).json(transferRequest);
}

async function reassignManager(req, res) {
  const { assignedManagerId } = req.body || {};
  if (!assignedManagerId) {
    return res.status(400).json({ error: { message: 'assignedManagerId is required', code: 'VALIDATION_ERROR' } });
  }

  const transferRequest = await TransferRequest.findById(req.params.id);
  if (notFoundOrForbidden(req, res, transferRequest)) return undefined;
  if (transferRequest.status !== 'Pending Receiving HR Reassignment') {
    return res.status(409).json({ error: { message: 'This request is not awaiting reassignment', code: 'INVALID_STATUS_TRANSITION' } });
  }

  const { error, manager } = await validateManagerAssignment(assignedManagerId, transferRequest.newLocationId, transferRequest.newDepartmentId);
  if (error) {
    return res.status(error.status).json({ error: { message: error.message, code: error.code } });
  }

  transferRequest.receivingManagerId = manager._id;
  advanceStatus(transferRequest, 'Pending Receiving Manager Approval');
  await transferRequest.save();

  return res.status(200).json(transferRequest);
}

async function triggerFulfillment(req, res) {
  const transferRequest = await TransferRequest.findById(req.params.id);
  if (notFoundOrForbidden(req, res, transferRequest)) return undefined;
  if (transferRequest.status !== 'Pending Fulfillment Trigger') {
    return res.status(409).json({ error: { message: 'This request is not awaiting fulfillment trigger', code: 'INVALID_STATUS_TRANSITION' } });
  }

  transferRequest.payrollStatus = 'Pending';
  transferRequest.itStatus = 'Pending';
  transferRequest.facilitiesStatus = String(transferRequest.newLocationId) !== String(transferRequest.currentLocationId) ? 'Pending' : 'Not Applicable';
  advanceStatus(transferRequest, 'Pending Fulfillment');
  await transferRequest.save();

  return res.status(200).json(transferRequest);
}

async function listFulfillmentPending(req, res) {
  // Must include 'Pending Fulfillment Trigger' too, not just 'Pending
  // Fulfillment' — that's the status a request is in the moment Receiving
  // Manager accepts, and it's the one AC7's "Trigger Fulfillment" button
  // acts on. Excluding it meant that button could never actually appear:
  // the request was invisible to this queue until something else had
  // already triggered it.
  const requests = await TransferRequest.find({
    status: { $in: ['Pending Fulfillment Trigger', 'Pending Fulfillment'] },
    receivingHrId: req.employee.id,
  });
  return res.status(200).json(requests);
}

async function confirmCompletion(req, res) {
  const transferRequest = await TransferRequest.findById(req.params.id);
  if (notFoundOrForbidden(req, res, transferRequest)) return undefined;

  const applicableIncomplete = ['payrollStatus', 'itStatus', 'facilitiesStatus'].some((field) => {
    const value = transferRequest[field];
    return value !== 'Not Applicable' && value !== 'Done';
  });
  if (applicableIncomplete) {
    return res.status(409).json({ error: { message: 'One or more applicable fulfillment items are not yet Done', code: 'FULFILLMENT_INCOMPLETE' } });
  }

  advanceStatus(transferRequest, 'Completed');
  await transferRequest.save();

  return res.status(200).json(transferRequest);
}

async function reopenHold(req, res) {
  const { assignedManagerId } = req.body || {};
  if (!assignedManagerId) {
    return res.status(400).json({ error: { message: 'assignedManagerId is required', code: 'VALIDATION_ERROR' } });
  }

  const transferRequest = await TransferRequest.findById(req.params.id);
  if (notFoundOrForbidden(req, res, transferRequest)) return undefined;
  if (transferRequest.status !== 'Hold') {
    return res.status(409).json({ error: { message: 'This request is not on Hold', code: 'INVALID_STATUS_TRANSITION' } });
  }

  const windowExpiry = new Date(transferRequest.holdStartedAt);
  windowExpiry.setMonth(windowExpiry.getMonth() + HOLD_WINDOW_MONTHS);
  if (new Date() > windowExpiry) {
    return res.status(409).json({ error: { message: 'The 6-month hold window has expired', code: 'HOLD_WINDOW_EXPIRED' } });
  }

  const { error, manager } = await validateManagerAssignment(assignedManagerId, transferRequest.newLocationId, transferRequest.newDepartmentId);
  if (error) {
    return res.status(error.status).json({ error: { message: error.message, code: error.code } });
  }

  transferRequest.receivingManagerId = manager._id;
  transferRequest.holdReason = null;
  transferRequest.holdStartedAt = null;
  advanceStatus(transferRequest, 'Pending Receiving Manager Approval');
  await transferRequest.save();

  return res.status(200).json(transferRequest);
}

module.exports = {
  listGatePending,
  listReassignmentPending,
  listHoldPending,
  gateDecision,
  reassignManager,
  triggerFulfillment,
  listFulfillmentPending,
  confirmCompletion,
  reopenHold,
};
