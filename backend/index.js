// Production-Ready Express Application Entry Point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');

// Load environment configuration first
require('./config/env');

const logger = require('./config/logger');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const errorHandler = require('./middleware/errorHandler');
const CronJobs = require('./jobs/cronJobs');

// Import route files
const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const skillRoutes = require('./routes/skills');
const employeeRoutes = require('./routes/employees');
const leaveRoutes = require('./routes/leaves'); 
const attendanceRoutes = require('./routes/attendance');
const assetRoutes = require('./routes/assets');
const healthRoutes = require('./routes/health');
const teamRoutes = require('./routes/teams');

const app = express();
const port = process.env.PORT || 5000;

// Security headers (Helmet)
app.use(helmet());

// Rate Limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// CORS Config (allow communication from frontend)
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Request body parsers
app.use(express.json());

// Log incoming API Requests
app.use(loggerMiddleware);

// API v1 Versioned Router Setup
const apiV1Router = express.Router();
apiV1Router.use('/auth', authLimiter, authRoutes);
apiV1Router.use('/departments', departmentRoutes);
apiV1Router.use('/skills', skillRoutes);
apiV1Router.use('/employees', employeeRoutes);
apiV1Router.use('/leaves', leaveRoutes);
apiV1Router.use('/attendance', attendanceRoutes);
apiV1Router.use('/assets', assetRoutes);
apiV1Router.use('/health', healthRoutes);
apiV1Router.use('/teams', teamRoutes);

// Mount versioned API routes
app.use('/api/v1', apiV1Router);

// Backward Compatibility: Mount directly on /api as well
app.use('/api', apiV1Router);

// Swagger Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Basic default landing page
app.get('/', (req, res) => {
  res.send('i-SOFTZONE Backend is running! API documentation is available at <a href="/api-docs">/api-docs</a>');
});

// Centralized Error Handling (must be registered last)
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
    logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
    
    // Initialize background jobs
    CronJobs.init();
  });
}

module.exports = app;