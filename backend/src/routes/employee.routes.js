const express = require('express');
const adminAuth = require('../middleware/adminAuth.middleware');
const controller = require('../controllers/employee.controller');

const router = express.Router();

router.use(adminAuth);

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create an Employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, locationId, departmentId, roleId]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, description: "Also the portal login identifier." }
 *               password: { type: string, description: "Set by the Admin directly; hashed and never returned." }
 *               locationId: { type: string }
 *               departmentId: { type: string }
 *               roleId: { type: string }
 *               managerId: { type: string, nullable: true }
 *               hrId: { type: string, nullable: true }
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
 *                 email: { type: string }
 *                 isActive: { type: boolean }
 *                 locationId: { type: string }
 *                 departmentId: { type: string }
 *                 roleId: { type: string }
 *                 managerId: { type: string, nullable: true }
 *                 hrId: { type: string, nullable: true }
 *                 mustChangePassword: { type: boolean }
 *       400:
 *         description: >
 *           VALIDATION_ERROR (name/email/password/locationId/departmentId/roleId missing) |
 *           MANAGER_REQUIRED (regular Employee missing managerId) |
 *           HR_REQUIRED (regular or Manager-category Employee missing hrId) |
 *           MAPPING_NOT_ALLOWED (HR-category Employee given managerId/hrId) |
 *           INVALID_MANAGER_ROLE (managerId's Employee is not Manager-category) |
 *           INVALID_HR_ROLE (hrId's Employee is not HR-category) |
 *           MAPPING_SCOPE_MISMATCH (managerId/hrId Employee not in the same Location+Department)
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: >
 *           NOT_FOUND (locationId/departmentId/roleId does not reference an existing record) |
 *           MANAGER_NOT_FOUND (managerId does not reference an existing Employee) |
 *           HR_NOT_FOUND (hrId does not reference an existing Employee)
 *       409:
 *         description: DUPLICATE_EMAIL (email already exists on another Employee)
 */
router.post('/', controller.create);

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: List Employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         required: false
 *       - in: query
 *         name: locationId
 *         schema: { type: string }
 *         required: false
 *       - in: query
 *         name: departmentId
 *         schema: { type: string }
 *         required: false
 *       - in: query
 *         name: roleId
 *         schema: { type: string }
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
 *                   email: { type: string }
 *                   isActive: { type: boolean }
 *                   locationId: { type: string }
 *                   departmentId: { type: string }
 *                   roleId: { type: string }
 *                   managerId: { type: string, nullable: true }
 *                   hrId: { type: string, nullable: true }
 *                   mustChangePassword: { type: boolean }
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 */
router.get('/', controller.list);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get an Employee by id
 *     tags: [Employees]
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
 *                 email: { type: string }
 *                 isActive: { type: boolean }
 *                 locationId: { type: string }
 *                 departmentId: { type: string }
 *                 roleId: { type: string }
 *                 managerId: { type: string, nullable: true }
 *                 hrId: { type: string, nullable: true }
 *                 mustChangePassword: { type: boolean }
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: NOT_FOUND — no Employee with this id
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: Update an Employee (same mapping validation as create; never touches credentials)
 *     tags: [Employees]
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
 *             required: [name, email, locationId, departmentId, roleId]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               locationId: { type: string }
 *               departmentId: { type: string }
 *               roleId: { type: string }
 *               managerId: { type: string, nullable: true }
 *               hrId: { type: string, nullable: true }
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
 *                 email: { type: string }
 *                 isActive: { type: boolean }
 *                 locationId: { type: string }
 *                 departmentId: { type: string }
 *                 roleId: { type: string }
 *                 managerId: { type: string, nullable: true }
 *                 hrId: { type: string, nullable: true }
 *       400:
 *         description: >
 *           Same set as POST /employees (VALIDATION_ERROR, MANAGER_REQUIRED, HR_REQUIRED,
 *           MAPPING_NOT_ALLOWED, INVALID_MANAGER_ROLE, INVALID_HR_ROLE, MAPPING_SCOPE_MISMATCH)
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: >
 *           NOT_FOUND (no Employee with this id, or locationId/departmentId/roleId does not reference
 *           an existing record) | MANAGER_NOT_FOUND | HR_NOT_FOUND
 *       409:
 *         description: Same set as POST /employees (DUPLICATE_EMAIL)
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /employees/{id}/status:
 *   patch:
 *     summary: Activate or deactivate an Employee (soft delete)
 *     tags: [Employees]
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
 *                 email: { type: string }
 *                 isActive: { type: boolean }
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: NOT_FOUND — no Employee with this id
 */
router.patch('/:id/status', controller.setStatus);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Permanently delete an Employee (hard delete, irreversible)
 *     tags: [Employees]
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
 *         description: NOT_FOUND — no Employee with this id
 *       409:
 *         description: EMPLOYEE_HAS_DEPENDENTS — one or more other Employees reference this one as managerId or hrId
 */
router.delete('/:id', controller.remove);

module.exports = router;
