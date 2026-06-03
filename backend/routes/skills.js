const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// GET all skills
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM skills ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error fetching skills' });
    }
});

// POST create new skill
router.post('/', authMiddleware, async (req, res) => {
    const { skill_name } = req.body;

    if (!skill_name) {
        return res.status(400).json({ message: 'Skill name is required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO skills (skill_name) VALUES ($1) RETURNING *',
            [skill_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error creating skill' });
    }
});

// PUT update skill
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { skill_name } = req.body;

    if (!skill_name) {
        return res.status(400).json({ message: 'Skill name is required' });
    }

    try {
        const result = await db.query(
            'UPDATE skills SET skill_name = $1 WHERE id = $2 RETURNING *',
            [skill_name, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Skill not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error updating skill' });
    }
});

// DELETE skill
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            'DELETE FROM skills WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Skill not found' });
        }
        res.json({ message: 'Skill deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error deleting skill' });
    }
});

module.exports = router;