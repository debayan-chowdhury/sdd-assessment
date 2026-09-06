const express = require('express');
const adminAuth = require('../middleware/adminAuth.middleware');
const controller = require('../controllers/department.controller');

const router = express.Router();

router.use(adminAuth);

/**
 * @swagger
 * /departments:
 *   post:
 *     summary: Create a Department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 name: { type: string }
 *                 code: { type: string }
 *                 isActive: { type: boolean }
 *       400:
 *         description: VALIDATION_ERROR — name or code missing/empty
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       409:
 *         description: DUPLICATE_CODE — code already exists on another Department
 */
router.post('/', controller.create);

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: List Departments
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         required: false
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
 *                   isActive: { type: boolean }
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 */
router.get('/', controller.list);

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     summary: Get a Department by id
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
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
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 name: { type: string }
 *                 code: { type: string }
 *                 isActive: { type: boolean }
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: NOT_FOUND — no Department with this id
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     summary: Update a Department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
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
 *             required: [name, code]
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 name: { type: string }
 *                 code: { type: string }
 *                 isActive: { type: boolean }
 *       400:
 *         description: VALIDATION_ERROR — name or code missing/empty
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: NOT_FOUND — no Department with this id
 *       409:
 *         description: DUPLICATE_CODE — code already exists on another Department
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /departments/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a Department (soft delete)
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
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
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 name: { type: string }
 *                 code: { type: string }
 *                 isActive: { type: boolean }
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: NOT_FOUND — no Department with this id
 *       409:
 *         description: DEPARTMENT_HAS_ACTIVE_EMPLOYEES — setting isActive false while one or more active Employees are mapped to this Department
 */
router.patch('/:id/status', controller.setStatus);

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     summary: Permanently delete a Department (hard delete, irreversible)
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: No Content
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: NOT_FOUND — no Department with this id
 *       409:
 *         description: DEPARTMENT_HAS_EMPLOYEES — one or more Employees (active or inactive) are mapped to this Department
 */
router.delete('/:id', controller.remove);

/**
 * @swagger
 * /departments/{id}/roles:
 *   post:
 *     summary: Enable an existing (global) Role for this Department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
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
 *             required: [roleId]
 *             properties:
 *               roleId: { type: string }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 departmentId: { type: string }
 *                 roleId: { type: string }
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: NOT_FOUND — Department or Role not found
 *       409:
 *         description: MAPPING_ALREADY_EXISTS — this Department↔Role pairing already exists
 */
router.post('/:id/roles', controller.mapRole);

/**
 * @swagger
 * /departments/{id}/roles/{roleId}:
 *   delete:
 *     summary: Disable (remove) a Role from this Department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: No Content
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: NOT_FOUND — mapping does not exist
 */
router.delete('/:id/roles/:roleId', controller.unmapRole);

/**
 * @swagger
 * /departments/{id}/roles:
 *   get:
 *     summary: List Roles enabled for this Department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
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
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   name: { type: string }
 *                   code: { type: string }
 *                   isActive: { type: boolean }
 *                   category: { type: string, enum: [HR, Manager], nullable: true }
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: NOT_FOUND — Department not found
 */
router.get('/:id/roles', controller.listRoles);

module.exports = router;
