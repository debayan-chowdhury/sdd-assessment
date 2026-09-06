const express = require('express');
const employeeAuth = require('../middleware/employeeAuth.middleware');
const controller = require('../controllers/options.controller');

const router = express.Router();

router.use(employeeAuth);

/**
 * @swagger
 * /options/locations:
 *   get:
 *     summary: List active Locations (Employee-accessible, for form option lists)
 *     tags: [Options]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   name: { type: string }
 *                   code: { type: string }
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.get('/locations', controller.listLocations);

/**
 * @swagger
 * /options/departments:
 *   get:
 *     summary: >
 *       List active Departments (Employee-accessible). With locationId, only Departments qualifying at
 *       that Location are returned (at least one active HR-category and one active Manager-category
 *       Employee there — the minimum staffing a transfer into that Location+Department would need to
 *       proceed through receiving-HR/manager approval), for form option lists. Without locationId,
 *       every active Department is returned unfiltered, for id->name display resolution.
 *     tags: [Options]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         required: false
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   name: { type: string }
 *                   code: { type: string }
 *       400:
 *         description: VALIDATION_ERROR — locationId missing
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.get('/departments', controller.listDepartments);

/**
 * @swagger
 * /options/roles:
 *   get:
 *     summary: List active Roles (Employee-accessible, for form option lists)
 *     tags: [Options]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   name: { type: string }
 *                   code: { type: string }
 *                   category: { type: string, enum: [HR, Manager, Payroll, IT, Facilities], nullable: true }
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.get('/roles', controller.listRoles);

/**
 * @swagger
 * /options/employees:
 *   get:
 *     summary: >
 *       Resolve Employee names for a bounded set of ids (Employee-accessible). Used to display an
 *       employee's name from a TransferRequest's employeeId in approval-queue screens — deliberately
 *       not a full roster listing (that stays admin-only at GET /employees).
 *     tags: [Options]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema: { type: string }
 *         description: Comma-separated Employee ids.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   name: { type: string }
 *       400:
 *         description: VALIDATION_ERROR — ids missing
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.get('/employees', controller.listEmployeesByIds);

/**
 * @swagger
 * /options/managers:
 *   get:
 *     summary: >
 *       List active Manager-category Employees at a Location+Department (Employee-accessible). Used to
 *       populate the Receiving HR manager-selection picker (accept the gate, reassign, reopen a hold) —
 *       mirrors the same eligibility check the corresponding POST endpoints validate against server-side.
 *     tags: [Options]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: departmentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   name: { type: string }
 *       400:
 *         description: VALIDATION_ERROR — locationId or departmentId missing
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.get('/managers', controller.listManagers);

module.exports = router;
