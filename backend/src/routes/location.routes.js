const express = require('express');
const adminAuth = require('../middleware/adminAuth.middleware');
const controller = require('../controllers/location.controller');

const router = express.Router();

router.use(adminAuth);

/**
 * @swagger
 * /locations:
 *   post:
 *     summary: Create a Location
 *     tags: [Locations]
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
 *         description: DUPLICATE_CODE — code already exists on another Location
 */
router.post('/', controller.create);

/**
 * @swagger
 * /locations:
 *   get:
 *     summary: List Locations
 *     tags: [Locations]
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
 * /locations/{id}:
 *   get:
 *     summary: Get a Location by id
 *     tags: [Locations]
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
 *         description: NOT_FOUND — no Location with this id
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /locations/{id}:
 *   put:
 *     summary: Update a Location
 *     tags: [Locations]
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
 *         description: NOT_FOUND — no Location with this id
 *       409:
 *         description: DUPLICATE_CODE — code already exists on another Location
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /locations/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a Location (soft delete)
 *     tags: [Locations]
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
 *         description: NOT_FOUND — no Location with this id
 *       409:
 *         description: LOCATION_HAS_ACTIVE_EMPLOYEES — setting isActive false while one or more active Employees are mapped to this Location
 */
router.patch('/:id/status', controller.setStatus);

/**
 * @swagger
 * /locations/{id}:
 *   delete:
 *     summary: Permanently delete a Location (hard delete, irreversible)
 *     tags: [Locations]
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
 *         description: NOT_FOUND — no Location with this id
 *       409:
 *         description: LOCATION_HAS_EMPLOYEES — one or more Employees (active or inactive) are mapped to this Location
 */
router.delete('/:id', controller.remove);

/**
 * @swagger
 * /locations/{id}/departments:
 *   post:
 *     summary: Map a Department to this Location
 *     tags: [Locations]
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
 *             required: [departmentId]
 *             properties:
 *               departmentId: { type: string }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 locationId: { type: string }
 *                 departmentId: { type: string }
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: NOT_FOUND — Location or Department not found
 *       409:
 *         description: MAPPING_ALREADY_EXISTS — this Location↔Department pairing already exists
 */
router.post('/:id/departments', controller.mapDepartment);

/**
 * @swagger
 * /locations/{id}/departments/{departmentId}:
 *   delete:
 *     summary: Remove a Location↔Department mapping
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: departmentId
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
router.delete('/:id/departments/:departmentId', controller.unmapDepartment);

/**
 * @swagger
 * /locations/{id}/departments:
 *   get:
 *     summary: List Departments mapped to this Location
 *     tags: [Locations]
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
 *       401:
 *         description: UNAUTHORIZED — no valid admin token
 *       404:
 *         description: NOT_FOUND — Location not found
 */
router.get('/:id/departments', controller.listDepartments);

module.exports = router;
