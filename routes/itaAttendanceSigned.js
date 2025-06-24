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

// Create ITA Attendance Signed by Student
router.post('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const {
            ita_master_id,
            student_id,
            session_date,
            start_time,
            end_time,
            hours_completed,
            student_signature,
            notes,
            status = 'pending'
        } = req.body;

        // Validate and convert IDs to proper values
        const validItaMasterId = ita_master_id && ita_master_id !== '' ? parseInt(ita_master_id) : null;
        const validStudentId = student_id && student_id !== '' ? parseInt(student_id) : null;

        // Get student name from students table
        let studentName = '';
        if (validStudentId) {
            const [studentRows] = await connection.execute(
                'SELECT CONCAT(first_name, " ", last_name) as full_name FROM students WHERE id = ?',
                [validStudentId]
            );
            if (studentRows.length > 0) {
                studentName = studentRows[0].full_name;
            }
        }

        const [result] = await connection.execute(
            `INSERT INTO ita_attendance_signed 
            (ita_master_id, student_id, student_name, session_date, start_time, end_time, hours_completed, student_signature, notes, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [validItaMasterId, validStudentId, studentName, session_date, start_time, end_time, hours_completed, student_signature, notes, status]
        );

        await logActivity('ITA Attendance Signed', 'CREATE', `Created ITA Attendance Signed record ID: ${result.insertId}`, req.user?.id);

        await connection.end();
        res.status(201).json({
            success: true,
            message: 'ITA Attendance Signed created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Error creating ITA Attendance Signed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create ITA Attendance Signed',
            error: error.message
        });
    }
});

// Get all ITA Attendance Signed records with related data
router.get('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { page = 1, limit = 10, status, student_id, ita_master_id, session_date } = req.query;
        const pageNum = Number.isNaN(Number(page)) ? 1 : parseInt(page);
        const limitNum = Number.isNaN(Number(limit)) ? 10 : parseInt(limit);
        const offsetNum = (pageNum - 1) * limitNum;

        // Ensure limitNum and offsetNum are safe integers
        const safeLimit = Number.isInteger(limitNum) && limitNum > 0 ? limitNum : 10;
        const safeOffset = Number.isInteger(offsetNum) && offsetNum >= 0 ? offsetNum : 0;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (status) {
            whereClause += ' AND ias.status = ?';
            params.push(status);
        }
        if (student_id) {
            whereClause += ' AND ias.student_id = ?';
            params.push(student_id);
        }
        if (ita_master_id) {
            whereClause += ' AND ias.ita_master_id = ?';
            params.push(ita_master_id);
        }
        if (session_date) {
            whereClause += ' AND ias.session_date = ?';
            params.push(session_date);
        }

        // Debug logging
        console.log('SQL Params:', { pageNum, limitNum, offsetNum, params });

        const sql = `SELECT 
                ias.*,
                COALESCE(ias.student_name, CONCAT(s.first_name, ' ', s.last_name)) as student_name,
                s.first_name as student_first_name,
                s.last_name as student_last_name,
                s.email as student_email,
                im.agreement_date,
                im.start_date,
                im.end_date,
                im.total_hours as agreement_total_hours,
                c.course_name as course_name
            FROM ita_attendance_signed ias
            LEFT JOIN students s ON ias.student_id = s.id
            LEFT JOIN ita_master im ON ias.ita_master_id = im.id
            LEFT JOIN courses c ON im.course_id = c.id
            ${whereClause}
            ORDER BY ias.session_date DESC, ias.created_at DESC
            LIMIT ${safeLimit} OFFSET ${safeOffset}`;
        console.log('SQL Query:', sql);
        let rows;
        if (params.length > 0) {
            [rows] = await connection.execute(sql, params);
        } else {
            [rows] = await connection.execute(sql);
        }

        // Get total count
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM ita_attendance_signed ias ${whereClause}`,
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
        console.error('Error fetching ITA Attendance Signed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ITA Attendance Signed',
            error: error.message
        });
    }
});

// Get ITA Attendance Signed by ID
router.get('/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { id } = req.params;

        const [rows] = await connection.execute(
            `SELECT 
                ias.*,
                COALESCE(ias.student_name, CONCAT(s.first_name, ' ', s.last_name)) as student_name,
                s.first_name as student_first_name,
                s.last_name as student_last_name,
                s.email as student_email,
                im.agreement_date,
                im.start_date,
                im.end_date,
                im.total_hours as agreement_total_hours,
                c.course_name as course_name
            FROM ita_attendance_signed ias
            LEFT JOIN students s ON ias.student_id = s.id
            LEFT JOIN ita_master im ON ias.ita_master_id = im.id
            LEFT JOIN courses c ON im.course_id = c.id
            WHERE ias.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'ITA Attendance Signed not found'
            });
        }

        await connection.end();
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching ITA Attendance Signed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ITA Attendance Signed',
            error: error.message
        });
    }
});

// Update ITA Attendance Signed
router.put('/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { id } = req.params;
        const {
            session_date,
            start_time,
            end_time,
            hours_completed,
            student_signature,
            instructor_signature,
            status,
            notes
        } = req.body;

        // Update student signature if provided
        let studentSignatureDate = null;
        if (student_signature && !req.body.student_signature_date) {
            studentSignatureDate = new Date();
        }

        // Update instructor signature if provided
        let instructorSignatureDate = null;
        if (instructor_signature && !req.body.instructor_signature_date) {
            instructorSignatureDate = new Date();
        }

        const [result] = await connection.execute(
            `UPDATE ita_attendance_signed SET 
            session_date = ?, start_time = ?, end_time = ?, hours_completed = ?, 
            student_signature = ?, student_signature_date = ?, 
            instructor_signature = ?, instructor_signature_date = ?, 
            status = ?, notes = ?
            WHERE id = ?`,
            [
                session_date, start_time, end_time, hours_completed,
                student_signature, studentSignatureDate || req.body.student_signature_date,
                instructor_signature, instructorSignatureDate || req.body.instructor_signature_date,
                status, notes, id
            ]
        );

        if (result.affectedRows === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'ITA Attendance Signed not found'
            });
        }

        await logActivity('ITA Attendance Signed', 'UPDATE', `Updated ITA Attendance Signed record ID: ${id}`, req.user?.id);

        await connection.end();
        res.json({
            success: true,
            message: 'ITA Attendance Signed updated successfully'
        });
    } catch (error) {
        console.error('Error updating ITA Attendance Signed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update ITA Attendance Signed',
            error: error.message
        });
    }
});

// Delete ITA Attendance Signed
router.delete('/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { id } = req.params;

        const [result] = await connection.execute(
            'DELETE FROM ita_attendance_signed WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'ITA Attendance Signed not found'
            });
        }

        await logActivity('ITA Attendance Signed', 'DELETE', `Deleted ITA Attendance Signed record ID: ${id}`, req.user?.id);

        await connection.end();
        res.json({
            success: true,
            message: 'ITA Attendance Signed deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting ITA Attendance Signed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete ITA Attendance Signed',
            error: error.message
        });
    }
});

// Student signature endpoint
router.post('/:id/student-signature', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { id } = req.params;
        const { student_signature } = req.body;

        const [result] = await connection.execute(
            `UPDATE ita_attendance_signed SET 
            student_signature = ?, student_signature_date = NOW(), 
            status = CASE WHEN instructor_signature IS NOT NULL THEN 'completed' ELSE 'signed_by_student' END
            WHERE id = ?`,
            [student_signature, id]
        );

        if (result.affectedRows === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'ITA Attendance Signed not found'
            });
        }

        await logActivity('ITA Attendance Signed', 'SIGNATURE', `Student signed ITA Attendance record ID: ${id}`, req.user?.id);

        await connection.end();
        res.json({
            success: true,
            message: 'Student signature added successfully'
        });
    } catch (error) {
        console.error('Error adding student signature:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add student signature',
            error: error.message
        });
    }
});

// Instructor signature endpoint
router.post('/:id/instructor-signature', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { id } = req.params;
        const { instructor_signature } = req.body;

        const [result] = await connection.execute(
            `UPDATE ita_attendance_signed SET 
            instructor_signature = ?, instructor_signature_date = NOW(), 
            status = CASE WHEN student_signature IS NOT NULL THEN 'completed' ELSE 'signed_by_instructor' END
            WHERE id = ?`,
            [instructor_signature, id]
        );

        if (result.affectedRows === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'ITA Attendance Signed not found'
            });
        }

        await logActivity('ITA Attendance Signed', 'SIGNATURE', `Instructor signed ITA Attendance record ID: ${id}`, req.user?.id);

        await connection.end();
        res.json({
            success: true,
            message: 'Instructor signature added successfully'
        });
    } catch (error) {
        console.error('Error adding instructor signature:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add instructor signature',
            error: error.message
        });
    }
});

// Get statistics for ITA Attendance Signed
router.get('/stats/overview', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);

        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_sessions,
                COUNT(CASE WHEN status = 'signed_by_student' THEN 1 END) as student_signed_sessions,
                COUNT(CASE WHEN status = 'signed_by_instructor' THEN 1 END) as instructor_signed_sessions,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
                SUM(hours_completed) as total_hours_completed
            FROM ita_attendance_signed
        `);

        await connection.end();
        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Error fetching ITA Attendance Signed stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ITA Attendance Signed statistics',
            error: error.message
        });
    }
});

module.exports = router; 