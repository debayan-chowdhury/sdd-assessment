const express = require('express');
require('express-async-errors');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const healthRoutes = require('./routes/health.routes');
const adminAuthRoutes = require('./routes/adminAuth.routes');
const authRoutes = require('./routes/auth.routes');
const locationRoutes = require('./routes/location.routes');
const departmentRoutes = require('./routes/department.routes');
const roleRoutes = require('./routes/role.routes');
const employeeRoutes = require('./routes/employee.routes');
const transferRequestRoutes = require('./routes/transferRequest.routes');
const optionsRoutes = require('./routes/options.routes');
const jobsRoutes = require('./routes/jobs.routes');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api/v1/admin', adminAuthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/transfer-requests', transferRequestRoutes);
app.use('/api/v1/options', optionsRoutes);
app.use('/api/v1/admin/jobs', jobsRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: { message: `Invalid value for ${err.path}: ${err.value}`, code: 'INVALID_ID' },
    });
  }
  console.error(err);
  return res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } });
});

module.exports = app;
