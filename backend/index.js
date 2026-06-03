const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables
// Import route files
const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const skillRoutes = require('./routes/skills');
const employeeRoutes = require('./routes/employees'); 

const app = express();
const port = 5000;

// Middleware to allow the frontend to communicate with the backend
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// Middleware to parse incoming JSON payloads
app.use(express.json());

// ROUTING: This tells the server that any request starting with /api/auth
// should be handled by your authRoutes logic
app.use('/api/auth', authRoutes);

// Department routes
app.use('/api/departments', departmentRoutes);

// Skills routes
app.use('/api/skills', skillRoutes);

// Employee routes
app.use('/api/employees', employeeRoutes);

// Basic health check endpoint
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});