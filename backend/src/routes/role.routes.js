const express = require('express');
const adminAuth = require('../middleware/adminAuth.middleware');
const controller = require('../controllers/role.controller');

const router = express.Router();

router.use(adminAuth);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a Role
 *     tags: [Roles]
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
 *               category: { type: string, enum: [HR, Manager, Payroll, IT, Facilities], nullable: true }
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
 *                 category: { type: string, enum: [HR, Manager, Payroll, IT, Facilities], nullable: true }
 *       400:
 *         description: VALIDATION_ERROR (name or code missing/empty) or INVALID_CATEGORY (category not HR, Manager, or omitted/null)
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       409:
 *         description: DUPLICATE_CODE — code already exists on another Role
 */
router.post('/', controller.create);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: List Roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         required: false
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [HR, Manager, Payroll, IT, Facilities] }
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
 *                   category: { type: string, enum: [HR, Manager, Payroll, IT, Facilities], nullable: true }
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 */
router.get('/', controller.list);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Get a Role by id
 *     tags: [Roles]
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
 *                 category: { type: string, enum: [HR, Manager, Payroll, IT, Facilities], nullable: true }
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: NOT_FOUND — no Role with this id
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Update a Role
 *     tags: [Roles]
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
 *               category: { type: string, enum: [HR, Manager, Payroll, IT, Facilities], nullable: true }
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
 *                 category: { type: string, enum: [HR, Manager, Payroll, IT, Facilities], nullable: true }
 *       400:
 *         description: VALIDATION_ERROR (name or code missing/empty) or INVALID_CATEGORY (category not HR, Manager, or omitted/null)
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: NOT_FOUND — no Role with this id
 *       409:
 *         description: DUPLICATE_CODE — code already exists on another Role
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /roles/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a Role (soft delete)
 *     tags: [Roles]
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
 *                 category: { type: string, enum: [HR, Manager, Payroll, IT, Facilities], nullable: true }
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: NOT_FOUND — no Role with this id
 *       409:
 *         description: ROLE_HAS_ACTIVE_EMPLOYEES — setting isActive false while one or more active Employees hold this Role
 */
router.patch('/:id/status', controller.setStatus);

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Permanently delete a Role (hard delete, irreversible)
 *     tags: [Roles]
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
 *         description: NOT_FOUND — no Role with this id
 *       409:
 *         description: ROLE_HAS_EMPLOYEES — one or more Employees (active or inactive) hold this Role
 */
router.delete('/:id', controller.remove);

module.exports = router;
