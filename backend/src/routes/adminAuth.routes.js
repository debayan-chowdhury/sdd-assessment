const express = require('express');
const { login } = require('../controllers/adminAuth.controller');

const router = express.Router();

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Static admin login
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
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
 *                 admin:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     email: { type: string }
 *                     phone: { type: string }
 *       400:
 *         description: VALIDATION_ERROR — username or password missing/empty
 *       401:
 *         description: INVALID_CREDENTIALS — username/password do not match the configured admin credential
 */
router.post('/login', login);

module.exports = router;
