const TransferRequest = require('../models/TransferRequest');
const { computeEscalation } = require('../services/transferRequestWorkflow.service');

const ESCALATION_THRESHOLD_BUSINESS_DAYS = 5;
const ROLE_CATEGORY = 'Payroll';
const STATUS_FIELD = 'payrollStatus';

function forbiddenUnlessCategory(req, res) {
  if (req.employee.roleCategory !== ROLE_CATEGORY) {
    res.status(403).json({ error: { message: `Only ${ROLE_CATEGORY}-category Employees may access this`, code: 'FORBIDDEN' } });
    return true;
  }
  return false;
}

async function listPending(req, res) {
  if (forbiddenUnlessCategory(req, res)) return undefined;

  const requests = await TransferRequest.find({ [STATUS_FIELD]: 'Pending' });
  await Promise.all(requests.map((r) => computeEscalation(r, ESCALATION_THRESHOLD_BUSINESS_DAYS, { businessDaysOnly: true })));
  return res.status(200).json(requests);
}

async function reportStatus(req, res) {
  if (forbiddenUnlessCategory(req, res)) return undefined;

  const { status } = req.body || {};
  if (status !== 'Done') {
    return res.status(400).json({ error: { message: 'status must be Done', code: 'VALIDATION_ERROR' } });
  }

  const transferRequest = await TransferRequest.findById(req.params.id);
  if (!transferRequest) {
    return res.status(404).json({ error: { message: 'TransferRequest not found', code: 'NOT_FOUND' } });
  }
  if (transferRequest[STATUS_FIELD] !== 'Pending') {
    return res.status(409).json({ error: { message: `${STATUS_FIELD} is not currently reportable`, code: 'INVALID_STATUS_TRANSITION' } });
  }

  transferRequest[STATUS_FIELD] = status;
  await transferRequest.save();

  return res.status(200).json(transferRequest);
}

module.exports = { listPending, reportStatus };
