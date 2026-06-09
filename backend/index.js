const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');
require('dotenv').config(); // Load environment variables

// Import route files
const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const skillRoutes = require('./routes/skills');
const employeeRoutes = require('./routes/employees');
const leaveRoutes = require('./routes/leaves'); 
const attendanceRoutes = require('./routes/attendance');
const assetRoutes = require('./routes/assets');

const app = express();
const port = 5000;

// Security middleware (Helmet)
app.use(helmet());

// Rate Limiter middleware for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Middleware to allow the frontend to communicate with the backend
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// Middleware to parse incoming JSON payloads
app.use(express.json());

// ROUTING
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assets', assetRoutes);

// Swagger Documentation API UI Endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Basic health check endpoint
app.get('/', (req, res) => {
    res.send('Backend is running! API documentation is available at <a href="/api-docs">/api-docs</a>');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`API Documentation available at http://localhost:${port}/api-docs`);
});