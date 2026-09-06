const express = require('express');
const employeeAuth = require('../middleware/employeeAuth.middleware');
const controller = require('../controllers/employeeAuth.controller');

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Employee portal login
 *     tags: [Employee Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, description: "The Employee's email, also the portal login identifier." }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 employee:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     locationId: { type: string }
 *                     departmentId: { type: string }
 *                     roleId: { type: string }
 *                     roleCategory: { type: string, enum: [HR, Manager, Payroll, IT, Facilities], nullable: true }
 *                     mustChangePassword: { type: boolean }
 *       400:
 *         description: VALIDATION_ERROR — email or password missing/empty
 *       401:
 *         description: INVALID_CREDENTIALS — email does not resolve to an Employee, or password does not match (same code for both, never reveals which)
 *       403:
 *         description: ACCOUNT_INACTIVE — credentials are correct but the Employee's isActive is false
 */
router.post('/login', controller.login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get the calling Employee's full profile, with Location/Department/Role/Manager/HR names resolved
 *     tags: [Employee Auth]
 *     security:
 *       - employeeBearerAuth: []
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
 *                 locationId: { type: string }
 *                 locationName: { type: string, nullable: true }
 *                 departmentId: { type: string }
 *                 departmentName: { type: string, nullable: true }
 *                 roleId: { type: string }
 *                 roleName: { type: string, nullable: true }
 *                 roleCategory: { type: string, enum: [HR, Manager, Payroll, IT, Facilities], nullable: true }
 *                 managerId: { type: string, nullable: true }
 *                 managerName: { type: string, nullable: true }
 *                 hrId: { type: string, nullable: true }
 *                 hrName: { type: string, nullable: true }
 *                 mustChangePassword: { type: boolean }
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.get('/profile', employeeAuth, controller.profile);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change the calling Employee's password (mandatory on first login, optional afterward)
 *     tags: [Employee Auth]
 *     security:
 *       - employeeBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, description: "No complexity rule — any non-empty value is accepted." }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       400:
 *         description: >
 *           VALIDATION_ERROR (currentPassword/newPassword missing/empty) |
 *           INVALID_CURRENT_PASSWORD (currentPassword does not match the stored hash)
 *       401:
 *         description: UNAUTHORIZED — no valid Employee token
 */
router.post('/change-password', employeeAuth, controller.changePassword);

module.exports = router;
