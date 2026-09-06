const express = require('express');
const adminAuth = require('../middleware/adminAuth.middleware');
const controller = require('../controllers/jobs.controller');

const router = express.Router();

router.use(adminAuth);

/**
 * @swagger
 * /admin/jobs/due-org-updates/trigger:
 *   post:
 *     summary: Manually apply every due-but-not-yet-applied organisational update (same sweep the scheduled job runs every 15 minutes)
 *     tags: [Admin Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 appliedCount: { type: integer, description: "Number of TransferRequests whose Employee record was just updated." }
 *       401:
 *         description: UNAUTHORIZED — no valid Admin token
 */
router.post('/due-org-updates/trigger', controller.triggerDueOrgUpdates);

module.exports = router;
