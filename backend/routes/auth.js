const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

// Register Route
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // 1. Check if user already exists
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Determine role based on email
        const role = email.toLowerCase().includes('admin') ? 'ADMIN' : 'EMPLOYEE';

        // 3. Insert into PostgreSQL
        const newUser = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, hashedPassword, role]
        );

        res.status(201).json({ message: `User registered successfully as ${role}!` });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error during registration" });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find user
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        // 2. Check password
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({ message: "Wrong Password" });
        }

        // 3. Create Token
        const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ token, message: "Login Success" });
    } catch (error) {
        res.status(500).json({ message: "Server error during login" });
    }
});

// Get User Profile Route (Protected)
router.get('/user-profile', authMiddleware, async (req, res) => {
    try {
        res.json({ user: req.user });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error fetching user profile" });
    }
});

// Export the router so index.js can use it
module.exports = router;