const swaggerJsdoc = require('swagger-jsdoc');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SDD Assessment Backend',
      version: '1.0.0',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Admin JWT, issued by POST /admin/login (ADMIN_JWT_SECRET).' },
        employeeBearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Employee JWT, issued by POST /auth/login (EMPLOYEE_JWT_SECRET) — a separate token type from bearerAuth, never interchangeable.' },
      },
      schemas: {
        TransferRequest: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            employeeId: { type: 'string' },
            currentLocationId: { type: 'string' },
            currentDepartmentId: { type: 'string' },
            currentRoleId: { type: 'string' },
            newLocationId: { type: 'string' },
            newDepartmentId: { type: 'string' },
            newRoleId: { type: 'string' },
            effectiveDate: { type: 'string', format: 'date-time' },
            reason: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: [
                'Pending Current Manager Approval', 'Pending Current HR Approval',
                'Pending Receiving HR Approval', 'Pending Receiving Manager Approval',
                'Pending Receiving HR Reassignment', 'Pending Fulfillment Trigger',
                'Pending Fulfillment', 'Hold', 'Rejected', 'Completed',
              ],
            },
            statusEnteredAt: { type: 'string', format: 'date-time' },
            currentManagerId: { type: 'string', nullable: true },
            currentHrId: { type: 'string', nullable: true },
            receivingHrId: { type: 'string' },
            receivingManagerId: { type: 'string', nullable: true },
            rejectedManagerIds: { type: 'array', items: { type: 'string' } },
            rejectionReason: { type: 'string', nullable: true },
            holdReason: { type: 'string', nullable: true },
            holdStartedAt: { type: 'string', format: 'date-time', nullable: true },
            payrollStatus: { type: 'string', enum: ['Pending', 'Done', 'Not Applicable'], nullable: true },
            itStatus: { type: 'string', enum: ['Pending', 'Done', 'Not Applicable'], nullable: true },
            facilitiesStatus: { type: 'string', enum: ['Pending', 'Done', 'Not Applicable'], nullable: true },
            escalated: { type: 'boolean' },
            escalatedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
});

module.exports = swaggerSpec;
