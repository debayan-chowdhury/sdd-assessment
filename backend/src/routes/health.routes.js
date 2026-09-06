const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const MONGO_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Liveness/readiness probe (dev/infra endpoint, not part of any spec — see src/routes/health.routes.js)
 *     tags: [Health]
 *     servers:
 *       - url: /api
 *     responses:
 *       200:
 *         description: MongoDB connection is up
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 uptime: { type: number }
 *                 timestamp: { type: string, format: date-time }
 *                 db:
 *                   type: object
 *                   properties:
 *                     state: { type: string, enum: [connected, connecting, disconnecting, disconnected, unknown] }
 *       503:
 *         description: MongoDB connection is not currently connected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: degraded }
 *                 uptime: { type: number }
 *                 timestamp: { type: string, format: date-time }
 *                 db:
 *                   type: object
 *                   properties:
 *                     state: { type: string, enum: [connected, connecting, disconnecting, disconnected, unknown] }
 */
router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;

  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: {
      state: MONGO_STATES[dbState] ?? 'unknown',
    },
  });
});

module.exports = router;
