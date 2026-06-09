const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST create new employee
router.post('/', authMiddleware, async (req, res) => {
    const { department_id, phone, address, designation, salary, skills } = req.body;

    if (!department_id || !phone || !address || !designation || !salary) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Create employee profile
        const employeeResult = await db.query(
            'INSERT INTO employee_profiles (user_id, department_id, phone, address, designation, salary) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.user.id, department_id, phone, address, designation, salary]
        );

        const employee_id = employeeResult.rows[0].id;

        // Add skills if provided
        if (skills && skills.length > 0) {
            for (let skill_id of skills) {
                await db.query(
                    'INSERT INTO employee_skills (employee_id, skill_id) VALUES ($1, $2)',
                    [employee_id, skill_id]
                );
            }
        }

        res.status(201).json({ 
            message: 'Employee created successfully',
            employee: employeeResult.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error creating employee' });
    }
});

// GET all employees with JOIN queries
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                ep.id,
                ep.phone,
                ep.address,
                ep.designation,
                ep.salary,
                ep.created_at,
                u.name as employee_name,
                u.email,
                u.role,
                u.reporting_manager_id,
                m.name as manager_name,
                d.department_name
            FROM employee_profiles ep
            INNER JOIN users u ON ep.user_id = u.id
            LEFT JOIN users m ON u.reporting_manager_id = m.id
            INNER JOIN departments d ON ep.department_id = d.id
            ORDER BY ep.id DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error fetching employees' });
    }
});

// GET single employee with skills
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Get employee profile
        const employeeResult = await db.query(
            `SELECT 
                ep.id,
                ep.phone,
                ep.address,
                ep.designation,
                ep.salary,
                ep.created_at,
                u.name as employee_name,
                u.email,
                u.role,
                u.reporting_manager_id,
                m.name as manager_name,
                d.department_name
            FROM employee_profiles ep
            INNER JOIN users u ON ep.user_id = u.id
            LEFT JOIN users m ON u.reporting_manager_id = m.id
            INNER JOIN departments d ON ep.department_id = d.id
            WHERE ep.id = $1`,
            [id]
        );

        if (employeeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Get employee skills
        const skillsResult = await db.query(
            `SELECT s.id, s.skill_name
             FROM employee_skills es
             INNER JOIN skills s ON es.skill_id = s.id
             WHERE es.employee_id = $1`,
            [id]
        );

        // Get employee images
        const imagesResult = await db.query(
            'SELECT id, image_url FROM employee_images WHERE employee_id = $1',
            [id]
        );

        res.json({
            employee: employeeResult.rows[0],
            skills: skillsResult.rows,
            images: imagesResult.rows
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error fetching employee' });
    }
});

// PUT update employee
router.put('/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const { department_id, phone, address, designation, salary, skills, role, reporting_manager_id } = req.body;

    if (!department_id || !phone || !address || !designation || !salary) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Update employee profile
        const result = await db.query(
            'UPDATE employee_profiles SET department_id = $1, phone = $2, address = $3, designation = $4, salary = $5 WHERE id = $6 RETURNING *',
            [department_id, phone, address, designation, salary, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Update user's role and manager in users table if provided
        if (role !== undefined || reporting_manager_id !== undefined) {
            let updateFields = [];
            let values = [];
            
            if (role !== undefined && role !== null) {
                values.push(role);
                updateFields.push(`role = $${values.length}`);
            }
            
            if (reporting_manager_id !== undefined) {
                values.push(reporting_manager_id);
                updateFields.push(`reporting_manager_id = $${values.length}`);
            }
            
            if (updateFields.length > 0) {
                values.push(id);
                const query = `
                    UPDATE users 
                    SET ${updateFields.join(', ')} 
                    WHERE id = (SELECT user_id FROM employee_profiles WHERE id = $${values.length})
                `;
                await db.query(query, values);
            }
        }

        // Update skills if provided
        if (skills && skills.length > 0) {
            // Delete existing skills
            await db.query('DELETE FROM employee_skills WHERE employee_id = $1', [id]);
            
            // Add new skills
            for (let skill_id of skills) {
                await db.query(
                    'INSERT INTO employee_skills (employee_id, skill_id) VALUES ($1, $2)',
                    [id, skill_id]
                );
            }
        }

        res.json({ 
            message: 'Employee updated successfully',
            employee: result.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error updating employee' });
    }
});

// DELETE employee
router.delete('/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;

    try {
        // Delete employee skills
        await db.query('DELETE FROM employee_skills WHERE employee_id = $1', [id]);
        
        // Delete employee images
        await db.query('DELETE FROM employee_images WHERE employee_id = $1', [id]);
        
        // Delete employee profile
        const result = await db.query(
            'DELETE FROM employee_profiles WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error deleting employee' });
    }
});

// POST upload multiple employee images
router.post('/:id/upload', authMiddleware, upload.array('images', 5), async (req, res) => {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    try {
        // Check if employee exists
        const employeeExists = await db.query(
            'SELECT id FROM employee_profiles WHERE id = $1',
            [id]
        );

        if (employeeExists.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Insert uploaded images
        const uploadedImages = [];
        for (let file of req.files) {
            const imageUrl = `/uploads/${file.filename}`;
            const result = await db.query(
                'INSERT INTO employee_images (employee_id, image_url) VALUES ($1, $2) RETURNING *',
                [id, imageUrl]
            );
            uploadedImages.push(result.rows[0]);
        }

        res.status(201).json({ 
            message: 'Images uploaded successfully',
            images: uploadedImages
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error uploading images' });
    }
});

module.exports = router;