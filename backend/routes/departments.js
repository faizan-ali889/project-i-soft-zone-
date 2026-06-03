const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// GET all departments
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM departments ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error fetching departments' });
    }
});

// POST create new department
router.post('/', authMiddleware, async (req, res) => {
    const { department_name } = req.body;

    if (!department_name) {
        return res.status(400).json({ message: 'Department name is required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO departments (department_name) VALUES ($1) RETURNING *',
            [department_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error creating department' });
    }
});

// PUT update department
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { department_name } = req.body;

    if (!department_name) {
        return res.status(400).json({ message: 'Department name is required' });
    }

    try {
        const result = await db.query(
            'UPDATE departments SET department_name = $1 WHERE id = $2 RETURNING *',
            [department_name, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error updating department' });
    }
});

// DELETE department
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            'DELETE FROM departments WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error deleting department' });
    }
});

module.exports = router;