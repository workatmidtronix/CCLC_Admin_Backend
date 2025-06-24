const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { logActivity } = require('../utils/activityLogger');

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cclc_db'
};

// Create ITA Master
router.post('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const {
            student_id,
            course_id,
            instructor_id,
            agreement_date,
            start_date,
            end_date,
            total_hours,
            status = 'active',
            notes
        } = req.body;

        const [result] = await connection.execute(
            `INSERT INTO ita_master 
            (student_id, course_id, instructor_id, agreement_date, start_date, end_date, total_hours, status, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_id, course_id, instructor_id, agreement_date, start_date, end_date, total_hours, status, notes]
        );

        await logActivity('ITA Master', 'CREATE', `Created ITA Master record ID: ${result.insertId}`, req.user?.id);

        await connection.end();
        res.status(201).json({
            success: true,
            message: 'ITA Master created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Error creating ITA Master:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create ITA Master',
            error: error.message
        });
    }
});

// Get all ITA Masters with related data
router.get('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { page = 1, limit = 10, status, student_id, course_id } = req.query;
        const pageNum = Number.isNaN(Number(page)) ? 1 : parseInt(page);
        const limitNum = Number.isNaN(Number(limit)) ? 10 : parseInt(limit);
        const offsetNum = (pageNum - 1) * limitNum;
        const safeLimit = Number.isInteger(limitNum) && limitNum > 0 ? limitNum : 10;
        const safeOffset = Number.isInteger(offsetNum) && offsetNum >= 0 ? offsetNum : 0;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (status) {
            whereClause += ' AND im.status = ?';
            params.push(status);
        }
        if (student_id) {
            whereClause += ' AND im.student_id = ?';
            params.push(student_id);
        }
        if (course_id) {
            whereClause += ' AND im.course_id = ?';
            params.push(course_id);
        }

        const sql = `SELECT 
                im.*,
                s.first_name as student_first_name,
                s.last_name as student_last_name,
                s.email as student_email,
                c.course_name as course_name,
                i.name as instructor_name,
                i.email as instructor_email
            FROM ita_master im
            LEFT JOIN students s ON im.student_id = s.id
            LEFT JOIN courses c ON im.course_id = c.id
            LEFT JOIN instructors i ON im.instructor_id = i.id
            ${whereClause}
            ORDER BY im.created_at DESC
            LIMIT ${safeLimit} OFFSET ${safeOffset}`;
        let rows;
        if (params.length > 0) {
            [rows] = await connection.execute(sql, params);
        } else {
            [rows] = await connection.execute(sql);
        }

        // Get total count
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM ita_master im ${whereClause}`,
            params
        );

        await connection.end();
        res.json({
            success: true,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching ITA Masters:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ITA Masters',
            error: error.message
        });
    }
});

// Get ITA Master by ID
router.get('/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { id } = req.params;

        const [rows] = await connection.execute(
            `SELECT 
                im.*,
                s.first_name as student_first_name,
                s.last_name as student_last_name,
                s.email as student_email,
                c.course_name as course_name,
                i.name as instructor_name,
                i.email as instructor_email
            FROM ita_master im
            LEFT JOIN students s ON im.student_id = s.id
            LEFT JOIN courses c ON im.course_id = c.id
            LEFT JOIN instructors i ON im.instructor_id = i.id
            WHERE im.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'ITA Master not found'
            });
        }

        await connection.end();
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching ITA Master:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ITA Master',
            error: error.message
        });
    }
});

// Update ITA Master
router.put('/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { id } = req.params;
        const {
            student_id,
            course_id,
            instructor_id,
            agreement_date,
            start_date,
            end_date,
            total_hours,
            status,
            notes
        } = req.body;

        const [result] = await connection.execute(
            `UPDATE ita_master SET 
            student_id = ?, course_id = ?, instructor_id = ?, agreement_date = ?, 
            start_date = ?, end_date = ?, total_hours = ?, status = ?, notes = ?
            WHERE id = ?`,
            [student_id, course_id, instructor_id, agreement_date, start_date, end_date, total_hours, status, notes, id]
        );

        if (result.affectedRows === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'ITA Master not found'
            });
        }

        await logActivity('ITA Master', 'UPDATE', `Updated ITA Master record ID: ${id}`, req.user?.id);

        await connection.end();
        res.json({
            success: true,
            message: 'ITA Master updated successfully'
        });
    } catch (error) {
        console.error('Error updating ITA Master:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update ITA Master',
            error: error.message
        });
    }
});

// Delete ITA Master
router.delete('/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { id } = req.params;

        const [result] = await connection.execute(
            'DELETE FROM ita_master WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'ITA Master not found'
            });
        }

        await logActivity('ITA Master', 'DELETE', `Deleted ITA Master record ID: ${id}`, req.user?.id);

        await connection.end();
        res.json({
            success: true,
            message: 'ITA Master deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting ITA Master:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete ITA Master',
            error: error.message
        });
    }
});

// Get ITA Master statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);

        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_agreements,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_agreements,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_agreements,
                COUNT(CASE WHEN status = 'terminated' THEN 1 END) as terminated_agreements,
                SUM(total_hours) as total_hours_planned
            FROM ita_master
        `);

        await connection.end();
        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Error fetching ITA Master stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ITA Master statistics',
            error: error.message
        });
    }
});

module.exports = router; 