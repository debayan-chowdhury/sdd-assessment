const { applyAllDueOrgUpdates } = require('../services/transferRequestWorkflow.service');

// Manual trigger for the same sweep dueOrgUpdates.job.js runs on a timer —
// lets an Admin apply due organisational updates on demand (e.g. testing,
// or not wanting to wait up to 15 minutes for the next scheduled run)
// instead of only via the cron or an affected Employee's next login.
async function triggerDueOrgUpdates(req, res) {
  const appliedCount = await applyAllDueOrgUpdates();
  return res.status(200).json({ appliedCount });
}

module.exports = { triggerDueOrgUpdates };
