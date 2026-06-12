// Production-Ready Express Application Entry Point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');
const path = require('path');

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
const cronRoutes = require('./routes/cron');

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
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, false); // Block other origins cleanly without throwing uncaught server errors
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Request body parsers
app.use(express.json());

// Serve uploads directory statically (supports Vercel /tmp)
const uploadBase = (process.env.NODE_ENV === 'production' || process.env.VERCEL) ? require('os').tmpdir() : __dirname;
app.use('/uploads', express.static(path.join(uploadBase, 'uploads')));

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
apiV1Router.use('/cron', cronRoutes);

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
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(port, () => {
    logger.info(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
    logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
    
    // Initialize background jobs only in non-production environments
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      CronJobs.init();
    }

    // Ensure required tables exist
    const db = require('./config/db');
    db.query(`
      CREATE TABLE IF NOT EXISTS employee_documents (
        id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
        document_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        document_type VARCHAR(100) DEFAULT 'General',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS team_scrum_reports (
        id SERIAL PRIMARY KEY,
        team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        report_type VARCHAR(50) NOT NULL,
        report_date DATE DEFAULT CURRENT_DATE,
        tasks_completed TEXT,
        tasks_planned TEXT,
        blockers TEXT,
        file_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS team_repositories (
        id SERIAL PRIMARY KEY,
        team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        repo_name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, repo_name)
      );

      CREATE TABLE IF NOT EXISTS team_repo_commits (
        id SERIAL PRIMARY KEY,
        repo_id INT NOT NULL REFERENCES team_repositories(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        branch_name VARCHAR(50) DEFAULT 'main',
        commit_message VARCHAR(255) NOT NULL,
        commit_hash VARCHAR(40) NOT NULL,
        changed_files JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).then(() => {
      logger.info('Unified tables verification and dynamic boot creation completed.');
    }).catch(err => {
      logger.error('Error verifying database tables:', err);
    });
  });
}

module.exports = app;