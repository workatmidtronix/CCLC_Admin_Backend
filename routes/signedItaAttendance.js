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

// Create Signed ITA Attendance
router.post('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const {
            ita_master_id,
            student_id,
            instructor_id,
            session_date,
            start_time,
            end_time,
            hours_completed,
            student_signature,
            instructor_signature,
            notes,
            status = 'pending'
        } = req.body;

        // Calculate total hours accumulated
        const [hoursResult] = await connection.execute(
            'SELECT COALESCE(SUM(hours_completed), 0) as total_hours FROM signed_ita_attendance WHERE ita_master_id = ?',
            [ita_master_id]
        );

        const totalHoursAccumulated = parseFloat(hoursResult[0].total_hours) + parseFloat(hours_completed);

        const [result] = await connection.execute(
            `INSERT INTO signed_ita_attendance 
            (ita_master_id, student_id, instructor_id, session_date, start_time, end_time, 
             hours_completed, student_signature, instructor_signature, total_hours_accumulated, notes, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ita_master_id, student_id, instructor_id, session_date, start_time, end_time, 
             hours_completed, student_signature, instructor_signature, totalHoursAccumulated, notes, status]
        );

        await logActivity('Signed ITA Attendance', 'CREATE', `Created Signed ITA Attendance record ID: ${result.insertId}`, req.user?.id);

        await connection.end();
        res.status(201).json({
            success: true,
            message: 'Signed ITA Attendance created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Error creating Signed ITA Attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create Signed ITA Attendance',
            error: error.message
        });
    }
});

// Get all Signed ITA Attendance records with related data
router.get('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { page = 1, limit = 10, status, student_id, ita_master_id, instructor_id, session_date } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (status) {
            whereClause += ' AND sia.status = ?';
            params.push(status);
        }
        if (student_id) {
            whereClause += ' AND sia.student_id = ?';
            params.push(student_id);
        }
        if (ita_master_id) {
            whereClause += ' AND sia.ita_master_id = ?';
            params.push(ita_master_id);
        }
        if (instructor_id) {
            whereClause += ' AND sia.instructor_id = ?';
            params.push(instructor_id);
        }
        if (session_date) {
            whereClause += ' AND sia.session_date = ?';
            params.push(session_date);
        }

        const [rows] = await connection.execute(
            `SELECT 
                sia.*,
                s.first_name as student_first_name,
                s.last_name as student_last_name,
                s.email as student_email,
                i.first_name as instructor_first_name,
                i.last_name as instructor_last_name,
                i.email as instructor_email,
                im.agreement_date,
                im.start_date,
                im.end_date,
                im.total_hours as agreement_total_hours,
                c.name as course_name
            FROM signed_ita_attendance sia
            LEFT JOIN students s ON sia.student_id = s.id
            LEFT JOIN instructors i ON sia.instructor_id = i.id
            LEFT JOIN ita_master im ON sia.ita_master_id = im.id
            LEFT JOIN courses c ON im.course_id = c.id
            ${whereClause}
            ORDER BY sia.session_date DESC, sia.created_at DESC
            LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        // Get total count
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM signed_ita_attendance sia ${whereClause}`,
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
        console.error('Error fetching Signed ITA Attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Signed ITA Attendance',
            error: error.message
        });
    }
});

// Get Signed ITA Attendance by ID
router.get('/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { id } = req.params;

        const [rows] = await connection.execute(
            `SELECT 
                sia.*,
                s.first_name as student_first_name,
                s.last_name as student_last_name,
                s.email as student_email,
                i.first_name as instructor_first_name,
                i.last_name as instructor_last_name,
                i.email as instructor_email,
                im.agreement_date,
                im.start_date,
                im.end_date,
                im.total_hours as agreement_total_hours,
                c.name as course_name
            FROM signed_ita_attendance sia
            LEFT JOIN students s ON sia.student_id = s.id
            LEFT JOIN instructors i ON sia.instructor_id = i.id
            LEFT JOIN ita_master im ON sia.ita_master_id = im.id
            LEFT JOIN courses c ON im.course_id = c.id
            WHERE sia.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Signed ITA Attendance not found'
            });
        }

        await connection.end();
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching Signed ITA Attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Signed ITA Attendance',
            error: error.message
        });
    }
});

// Update Signed ITA Attendance
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
            `UPDATE signed_ita_attendance SET 
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
                message: 'Signed ITA Attendance not found'
            });
        }

        // Recalculate total hours accumulated for this ITA master
        const [itaResult] = await connection.execute(
            'SELECT ita_master_id FROM signed_ita_attendance WHERE id = ?',
            [id]
        );

        if (itaResult.length > 0) {
            const [hoursResult] = await connection.execute(
                'SELECT COALESCE(SUM(hours_completed), 0) as total_hours FROM signed_ita_attendance WHERE ita_master_id = ?',
                [itaResult[0].ita_master_id]
            );

            await connection.execute(
                'UPDATE signed_ita_attendance SET total_hours_accumulated = ? WHERE ita_master_id = ?',
                [hoursResult[0].total_hours, itaResult[0].ita_master_id]
            );
        }

        await logActivity('Signed ITA Attendance', 'UPDATE', `Updated Signed ITA Attendance record ID: ${id}`, req.user?.id);

        await connection.end();
        res.json({
            success: true,
            message: 'Signed ITA Attendance updated successfully'
        });
    } catch (error) {
        console.error('Error updating Signed ITA Attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update Signed ITA Attendance',
            error: error.message
        });
    }
});

// Delete Signed ITA Attendance
router.delete('/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { id } = req.params;

        const [result] = await connection.execute(
            'DELETE FROM signed_ita_attendance WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Signed ITA Attendance not found'
            });
        }

        await logActivity('Signed ITA Attendance', 'DELETE', `Deleted Signed ITA Attendance record ID: ${id}`, req.user?.id);

        await connection.end();
        res.json({
            success: true,
            message: 'Signed ITA Attendance deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting Signed ITA Attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete Signed ITA Attendance',
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
            `UPDATE signed_ita_attendance SET 
            student_signature = ?, student_signature_date = NOW(), 
            status = CASE WHEN instructor_signature IS NOT NULL THEN 'completed' ELSE 'signed_by_student' END
            WHERE id = ?`,
            [student_signature, id]
        );

        if (result.affectedRows === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Signed ITA Attendance not found'
            });
        }

        await logActivity('Signed ITA Attendance', 'SIGNATURE', `Student signed ITA Attendance record ID: ${id}`, req.user?.id);

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
            `UPDATE signed_ita_attendance SET 
            instructor_signature = ?, instructor_signature_date = NOW(), 
            status = CASE WHEN student_signature IS NOT NULL THEN 'completed' ELSE 'signed_by_instructor' END
            WHERE id = ?`,
            [instructor_signature, id]
        );

        if (result.affectedRows === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Signed ITA Attendance not found'
            });
        }

        await logActivity('Signed ITA Attendance', 'SIGNATURE', `Instructor signed ITA Attendance record ID: ${id}`, req.user?.id);

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

// Get statistics for Signed ITA Attendance
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
                SUM(hours_completed) as total_hours_completed,
                AVG(hours_completed) as avg_hours_per_session
            FROM signed_ita_attendance
        `);

        await connection.end();
        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Error fetching Signed ITA Attendance stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Signed ITA Attendance statistics',
            error: error.message
        });
    }
});

// Get progress report for ITA Master
router.get('/progress/:ita_master_id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { ita_master_id } = req.params;

        const [progress] = await connection.execute(`
            SELECT 
                im.total_hours as planned_hours,
                COALESCE(SUM(sia.hours_completed), 0) as completed_hours,
                COUNT(sia.id) as total_sessions,
                COUNT(CASE WHEN sia.status = 'completed' THEN 1 END) as completed_sessions,
                ROUND((COALESCE(SUM(sia.hours_completed), 0) / im.total_hours) * 100, 2) as completion_percentage
            FROM ita_master im
            LEFT JOIN signed_ita_attendance sia ON im.id = sia.ita_master_id
            WHERE im.id = ?
            GROUP BY im.id, im.total_hours
        `, [ita_master_id]);

        if (progress.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'ITA Master not found'
            });
        }

        await connection.end();
        res.json({
            success: true,
            data: progress[0]
        });
    } catch (error) {
        console.error('Error fetching ITA progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ITA progress',
            error: error.message
        });
    }
});

module.exports = router; 