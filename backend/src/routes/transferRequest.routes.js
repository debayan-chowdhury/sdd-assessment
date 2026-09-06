const express = require('express');
const employeeAuth = require('../middleware/employeeAuth.middleware');
const controller = require('../controllers/transferRequest.controller');
const currentManagerApproval = require('../controllers/currentManagerApproval.controller');
const currentHrApproval = require('../controllers/currentHrApproval.controller');
const receivingHrGatekeeping = require('../controllers/receivingHrGatekeeping.controller');
const receivingManagerApproval = require('../controllers/receivingManagerApproval.controller');
const payrollUpdate = require('../controllers/payrollUpdate.controller');
const itProvisioning = require('../controllers/itProvisioning.controller');
const facilitiesArrangement = require('../controllers/facilitiesArrangement.controller');

const router = express.Router();

router.use(employeeAuth);

/**
 * @swagger
 * /transfer-requests:
 *   post:
 *     summary: Submit a new Internal Transfer request
 *     tags: [Transfer Requests]
 *     security:
 *       - employeeBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newLocationId, newDepartmentId, newRoleId, effectiveDate]
 *             properties:
 *               newLocationId: { type: string }
 *               newDepartmentId: { type: string }
 *               newRoleId: { type: string }
 *               effectiveDate: { type: string, format: date-time, description: "Must be at least 30 days from submission." }
 *               reason: { type: string }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferRequest'
 *       400:
 *         description: >
 *           VALIDATION_ERROR (a required field is missing/empty) |
 *           EFFECTIVE_DATE_TOO_SOON (fewer than 30 days from today) |
 *           NO_CHANGE_REQUESTED (newLocationId, newDepartmentId, and newRoleId all match the caller's current values) |
 *           ROLE_CATEGORY_NOT_ALLOWED (newRoleId's category is not null — Manager/HR/IT/Payroll/Facilities Roles cannot be self-service transferred into)
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       404:
 *         description: >
 *           NOT_FOUND (newLocationId/newDepartmentId/newRoleId does not reference an existing active record) |
 *           NO_RECEIVING_HR (no active HR-category Employee at newLocationId+newDepartmentId)
 *       409:
 *         description: ACTIVE_REQUEST_EXISTS (the caller already has a non-terminal TransferRequest)
 */
router.post('/', controller.create);

/**
 * @swagger
 * /transfer-requests/me:
 *   get:
 *     summary: List the calling Employee's own Internal Transfer requests
 *     tags: [Transfer Requests]
 *     security:
 *       - employeeBearerAuth: []
 *     responses:
 *       200:
 *         description: OK, newest first
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.get('/me', controller.listMine);

/**
 * @swagger
 * /transfer-requests/pending/current-manager:
 *   get:
 *     summary: List requests awaiting the caller's decision as Current Manager
 *     tags: [Transfer Requests — Current Manager]
 *     security:
 *       - employeeBearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.get('/pending/current-manager', currentManagerApproval.listPending);

/**
 * @swagger
 * /transfer-requests/{id}/current-manager-decision:
 *   post:
 *     summary: Current Manager accepts or rejects a pending request
 *     tags: [Transfer Requests — Current Manager]
 *     security:
 *       - employeeBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [accept, reject] }
 *               reason: { type: string, description: "Required when decision is reject." }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferRequest'
 *       400:
 *         description: >
 *           VALIDATION_ERROR (decision missing/invalid) |
 *           REASON_REQUIRED (decision is reject with reason missing/empty)
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — caller is not this request's assigned Current Manager
 *       404:
 *         description: NOT_FOUND — no TransferRequest with this id
 *       409:
 *         description: INVALID_STATUS_TRANSITION — status is not Pending Current Manager Approval
 */
router.post('/:id/current-manager-decision', currentManagerApproval.decide);

/**
 * @swagger
 * /transfer-requests/pending/current-hr:
 *   get:
 *     summary: List requests awaiting the caller's decision as Current HR
 *     tags: [Transfer Requests — Current HR]
 *     security:
 *       - employeeBearerAuth: []
 *     responses:
 *       200:
 *         description: >
 *           OK. Each item is a TransferRequest, annotated with employeeTenureDays (number) and
 *           meetsMinimumTenure (boolean), computed from the requesting Employee's createdAt.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.get('/pending/current-hr', currentHrApproval.listPending);

/**
 * @swagger
 * /transfer-requests/{id}/current-hr-decision:
 *   post:
 *     summary: Current HR accepts (subject to a 6-month minimum tenure check) or rejects a pending request
 *     tags: [Transfer Requests — Current HR]
 *     security:
 *       - employeeBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [accept, reject] }
 *               reason: { type: string, description: "Optional — BRD-004 does not require a captured reason on reject." }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferRequest'
 *       400:
 *         description: VALIDATION_ERROR — decision missing/invalid
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — caller is not this request's assigned Current HR
 *       404:
 *         description: NOT_FOUND — no TransferRequest with this id
 *       409:
 *         description: INVALID_STATUS_TRANSITION — status is not Pending Current HR Approval
 */
router.post('/:id/current-hr-decision', currentHrApproval.decide);

/**
 * @swagger
 * /transfer-requests/pending/receiving-hr-gate:
 *   get:
 *     summary: List requests awaiting the caller's approval-gate decision as Receiving HR
 *     tags: [Transfer Requests — Receiving HR]
 *     security:
 *       - employeeBearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.get('/pending/receiving-hr-gate', receivingHrGatekeeping.listGatePending);

/**
 * @swagger
 * /transfer-requests/pending/receiving-hr-reassignment:
 *   get:
 *     summary: >
 *       List requests awaiting a new candidate Receiving Manager (Pending Receiving HR Reassignment),
 *       owned by the caller as Receiving HR. Not part of the original API contract — added to support
 *       the Reassign Manager action's list view (AC12).
 *     tags: [Transfer Requests — Receiving HR]
 *     security:
 *       - employeeBearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.get('/pending/receiving-hr-reassignment', receivingHrGatekeeping.listReassignmentPending);

/**
 * @swagger
 * /transfer-requests/pending/receiving-hr-hold:
 *   get:
 *     summary: >
 *       List requests on Hold, owned by the caller as Receiving HR. Not part of the original API
 *       contract — added to support the Reopen action's list view (AC13/AC14).
 *     tags: [Transfer Requests — Receiving HR]
 *     security:
 *       - employeeBearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.get('/pending/receiving-hr-hold', receivingHrGatekeeping.listHoldPending);

/**
 * @swagger
 * /transfer-requests/{id}/receiving-hr-gate-decision:
 *   post:
 *     summary: >
 *       Receiving HR accepts (assigning a Receiving Manager — this also immediately updates the
 *       Employee's Location/Department/Role) or rejects the request
 *     tags: [Transfer Requests — Receiving HR]
 *     security:
 *       - employeeBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [accept, reject] }
 *               assignedManagerId: { type: string, description: "Required when decision is accept." }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferRequest'
 *       400:
 *         description: >
 *           VALIDATION_ERROR (decision missing/invalid, or accept with assignedManagerId missing) |
 *           INVALID_MANAGER_ROLE (assignedManagerId is not an active Manager-category Employee at newLocationId+newDepartmentId)
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — caller is not this request's assigned Receiving HR
 *       404:
 *         description: >
 *           NOT_FOUND (no TransferRequest with this id) |
 *           MANAGER_NOT_FOUND (assignedManagerId does not reference an existing Employee)
 *       409:
 *         description: INVALID_STATUS_TRANSITION — status is not Pending Receiving HR Approval
 */
router.post('/:id/receiving-hr-gate-decision', receivingHrGatekeeping.gateDecision);

/**
 * @swagger
 * /transfer-requests/{id}/reassign-manager:
 *   post:
 *     summary: Receiving HR assigns the next candidate Receiving Manager after a rejection
 *     tags: [Transfer Requests — Receiving HR]
 *     security:
 *       - employeeBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignedManagerId]
 *             properties:
 *               assignedManagerId: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferRequest'
 *       400:
 *         description: >
 *           VALIDATION_ERROR (assignedManagerId missing) |
 *           INVALID_MANAGER_ROLE (assignedManagerId is not an active Manager-category Employee at newLocationId+newDepartmentId)
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — caller is not this request's assigned Receiving HR
 *       404:
 *         description: >
 *           NOT_FOUND (no TransferRequest with this id) |
 *           MANAGER_NOT_FOUND (assignedManagerId does not reference an existing Employee)
 *       409:
 *         description: INVALID_STATUS_TRANSITION — status is not Pending Receiving HR Reassignment
 */
router.post('/:id/reassign-manager', receivingHrGatekeeping.reassignManager);

/**
 * @swagger
 * /transfer-requests/{id}/trigger-fulfillment:
 *   post:
 *     summary: Receiving HR triggers Payroll/IT/Facilities to run in parallel, once the Receiving Manager has accepted
 *     tags: [Transfer Requests — Receiving HR]
 *     security:
 *       - employeeBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: >
 *           OK. Sets payrollStatus and itStatus to Pending; facilitiesStatus to Pending if
 *           newLocationId differs from currentLocationId, else Not Applicable.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — caller is not this request's assigned Receiving HR
 *       404:
 *         description: NOT_FOUND — no TransferRequest with this id
 *       409:
 *         description: INVALID_STATUS_TRANSITION — status is not Pending Fulfillment Trigger
 */
router.post('/:id/trigger-fulfillment', receivingHrGatekeeping.triggerFulfillment);

/**
 * @swagger
 * /transfer-requests/pending/receiving-hr-fulfillment:
 *   get:
 *     summary: >
 *       List requests in Pending Fulfillment Trigger (awaiting the Trigger Fulfillment action) or
 *       Pending Fulfillment, owned by the caller as Receiving HR
 *     tags: [Transfer Requests — Receiving HR]
 *     security:
 *       - employeeBearerAuth: []
 *     responses:
 *       200:
 *         description: OK — includes all three payrollStatus/itStatus/facilitiesStatus sub-statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.get('/pending/receiving-hr-fulfillment', receivingHrGatekeeping.listFulfillmentPending);

/**
 * @swagger
 * /transfer-requests/{id}/confirm-completion:
 *   post:
 *     summary: Receiving HR confirms completion once every applicable fulfillment sub-status is Done
 *     tags: [Transfer Requests — Receiving HR]
 *     security:
 *       - employeeBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK — status becomes Completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — caller is not this request's assigned Receiving HR
 *       404:
 *         description: NOT_FOUND — no TransferRequest with this id
 *       409:
 *         description: FULFILLMENT_INCOMPLETE — one or more applicable sub-statuses are not yet Done
 */
router.post('/:id/confirm-completion', receivingHrGatekeeping.confirmCompletion);

/**
 * @swagger
 * /transfer-requests/{id}/reopen-hold:
 *   post:
 *     summary: Receiving HR reopens a Hold request within its 6-month window, assigning a new candidate manager
 *     tags: [Transfer Requests — Receiving HR]
 *     security:
 *       - employeeBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignedManagerId]
 *             properties:
 *               assignedManagerId: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferRequest'
 *       400:
 *         description: >
 *           VALIDATION_ERROR (assignedManagerId missing) |
 *           INVALID_MANAGER_ROLE (assignedManagerId is not an active Manager-category Employee at newLocationId+newDepartmentId)
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — caller is not this request's assigned Receiving HR
 *       404:
 *         description: >
 *           NOT_FOUND (no TransferRequest with this id) |
 *           MANAGER_NOT_FOUND (assignedManagerId does not reference an existing Employee)
 *       409:
 *         description: >
 *           INVALID_STATUS_TRANSITION (status is not Hold) |
 *           HOLD_WINDOW_EXPIRED (more than 6 months have elapsed since holdStartedAt)
 */
router.post('/:id/reopen-hold', receivingHrGatekeeping.reopenHold);

/**
 * @swagger
 * /transfer-requests/pending/receiving-manager:
 *   get:
 *     summary: List requests awaiting the caller's decision as Receiving Manager
 *     tags: [Transfer Requests — Receiving Manager]
 *     security:
 *       - employeeBearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.get('/pending/receiving-manager', receivingManagerApproval.listPending);

/**
 * @swagger
 * /transfer-requests/{id}/receiving-manager-decision:
 *   post:
 *     summary: >
 *       Receiving Manager accepts or rejects. On reject, the system automatically routes to another
 *       candidate manager (Pending Receiving HR Reassignment) or, once every candidate has rejected, puts the request on Hold.
 *     tags: [Transfer Requests — Receiving Manager]
 *     security:
 *       - employeeBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [accept, reject] }
 *               reasonCode: { type: string, enum: [NO_HEADCOUNT, ROLE_SKILL_MISMATCH, TIMING_CONFLICT, OTHER], description: "Required when decision is reject." }
 *               reasonDetail: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferRequest'
 *       400:
 *         description: VALIDATION_ERROR — decision missing/invalid, or reject with reasonCode missing/not one of the enum values
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — caller is not this request's assigned Receiving Manager
 *       404:
 *         description: NOT_FOUND — no TransferRequest with this id
 *       409:
 *         description: INVALID_STATUS_TRANSITION — status is not Pending Receiving Manager Approval
 */
router.post('/:id/receiving-manager-decision', receivingManagerApproval.decide);

/**
 * @swagger
 * /transfer-requests/pending/payroll:
 *   get:
 *     summary: List requests waiting on Payroll (org-wide, not Location/Department-scoped)
 *     tags: [Transfer Requests — Payroll]
 *     security:
 *       - employeeBearerAuth: []
 *     responses:
 *       200:
 *         description: OK — payrollStatus Pending
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — caller does not hold a Payroll-category Role
 */
router.get('/pending/payroll', payrollUpdate.listPending);

/**
 * @swagger
 * /transfer-requests/{id}/payroll-status:
 *   post:
 *     summary: Payroll reports Done for a request
 *     tags: [Transfer Requests — Payroll]
 *     security:
 *       - employeeBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Done] }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferRequest'
 *       400:
 *         description: VALIDATION_ERROR — status missing/invalid
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — caller does not hold a Payroll-category Role
 *       404:
 *         description: NOT_FOUND — no TransferRequest with this id
 *       409:
 *         description: INVALID_STATUS_TRANSITION — payrollStatus is not Pending
 */
router.post('/:id/payroll-status', payrollUpdate.reportStatus);

/**
 * @swagger
 * /transfer-requests/pending/it:
 *   get:
 *     summary: List requests waiting on IT (org-wide, not Location/Department-scoped)
 *     tags: [Transfer Requests — IT]
 *     security:
 *       - employeeBearerAuth: []
 *     responses:
 *       200:
 *         description: OK — itStatus Pending
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — caller does not hold an IT-category Role
 */
router.get('/pending/it', itProvisioning.listPending);

/**
 * @swagger
 * /transfer-requests/{id}/it-status:
 *   post:
 *     summary: IT reports Done for a request
 *     tags: [Transfer Requests — IT]
 *     security:
 *       - employeeBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Done] }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferRequest'
 *       400:
 *         description: VALIDATION_ERROR — status missing/invalid
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — caller does not hold an IT-category Role
 *       404:
 *         description: NOT_FOUND — no TransferRequest with this id
 *       409:
 *         description: INVALID_STATUS_TRANSITION — itStatus is not Pending
 */
router.post('/:id/it-status', itProvisioning.reportStatus);

/**
 * @swagger
 * /transfer-requests/pending/facilities:
 *   get:
 *     summary: List requests waiting on Facilities (org-wide, not Location/Department-scoped)
 *     tags: [Transfer Requests — Facilities]
 *     security:
 *       - employeeBearerAuth: []
 *     responses:
 *       200:
 *         description: >
 *           OK — facilitiesStatus Pending. A request whose location didn't
 *           change is Not Applicable from the start and never appears here.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — caller does not hold a Facilities-category Role
 */
router.get('/pending/facilities', facilitiesArrangement.listPending);

/**
 * @swagger
 * /transfer-requests/{id}/facilities-status:
 *   post:
 *     summary: Facilities reports Done for a request
 *     tags: [Transfer Requests — Facilities]
 *     security:
 *       - employeeBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Done] }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferRequest'
 *       400:
 *         description: VALIDATION_ERROR — status missing/invalid
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — caller does not hold a Facilities-category Role
 *       404:
 *         description: NOT_FOUND — no TransferRequest with this id
 *       409:
 *         description: INVALID_STATUS_TRANSITION — facilitiesStatus is not Pending (e.g. Not Applicable)
 */
router.post('/:id/facilities-status', facilitiesArrangement.reportStatus);

/**
 * @swagger
 * /transfer-requests/{id}:
 *   get:
 *     summary: Get one of the caller's own Internal Transfer requests by id
 *     tags: [Transfer Requests]
 *     security:
 *       - employeeBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 *       403:
 *         description: FORBIDDEN — this TransferRequest does not belong to the caller
 *       404:
 *         description: NOT_FOUND — no TransferRequest with this id
 */
router.get('/:id', controller.getById);

module.exports = router;
