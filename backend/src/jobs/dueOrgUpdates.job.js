const cron = require('node-cron');
const { applyAllDueOrgUpdates } = require('../services/transferRequestWorkflow.service');

// Every 15 minutes — effectiveDate is date-granularity, not time-of-day, so
// this is far more precision than the business rule actually needs; it just
// has to run more often than employees are likely to go without logging in,
// so the deferred org update (see receiving-hr-transfer-gatekeeping.spec.md's
// amendment) lands close to the effective date even if nobody authenticates
// around that time to trigger applyDueOrgUpdate's lazy per-request check.
const SCHEDULE = '*/15 * * * *';

function startDueOrgUpdatesJob() {
  return cron.schedule(SCHEDULE, async () => {
    try {
      const count = await applyAllDueOrgUpdates();
      if (count > 0) {
        console.log(`[dueOrgUpdatesJob] applied ${count} due organisational update(s)`);
      }
    } catch (err) {
      console.error('[dueOrgUpdatesJob] failed:', err.message);
    }
  });
}

module.exports = { startDueOrgUpdatesJob };
