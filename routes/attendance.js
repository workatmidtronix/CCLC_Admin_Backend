const express = require('express');
const router = express.Router();

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', async (req, res) => {
  try {
    const attendance = [
      { id: 1, studentId: 1, studentName: 'John Doe', date: '2025-06-09', status: 'Present' },
      { id: 2, studentId: 2, studentName: 'Sarah Smith', date: '2025-06-09', status: 'Present' }
    ];
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/attendance - Save attendance for multiple students
router.post('/', async (req, res) => {
    const { sessionId, attendanceDate, attendanceRecords } = req.body;
    const db = req.app.locals.db;

    if (!sessionId || !attendanceDate || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid input data.' });
    }

    try {
        const query = `
            INSERT INTO attendance (student_id, session_id, attendance_date, status, notes, recorded_by) 
            VALUES ?
            ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes), recorded_by = VALUES(recorded_by)
        `;
        
        const recordedBy = req.user ? req.user.id : null;

        const values = attendanceRecords.map(record => [
            record.student_id,
            sessionId,
            attendanceDate,
            record.status,
            record.notes || null,
            recordedBy
        ]);

        db.query(query, [values], (err, result) => {
            if (err) {
                console.error('Error saving attendance:', err);
                return res.status(500).json({ success: false, message: 'Error saving attendance', error: err.message });
            }
            res.status(201).json({ success: true, message: 'Attendance saved successfully.' });
        });
    } catch (error) {
        console.error('Error saving attendance:', error);
        res.status(500).json({ success: false, message: 'Error saving attendance', error: error.message });
    }
});

// GET /api/attendance/report - Fetch attendance report
router.get('/report', (req, res) => {
    const db = req.app.locals.db;
    try {
        const query = `
            SELECT 
                a.attendance_date,
                CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                a.status AS attendance_status,
                COALESCE(i.name, 'Public') AS added_user,
                a.created_at AS added_time,
                ses.id AS session_id,
                ses.session_name,
                c.course_name,
                c.id as course_id
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            JOIN sessions ses ON a.session_id = ses.id
            JOIN courses c ON ses.course_id = c.id
            LEFT JOIN instructors i ON a.recorded_by = i.id
            ORDER BY ses.session_date DESC, ses.id, s.last_name, s.first_name;
        `;
        
        db.query(query, (err, report) => {
            if (err) {
                console.error('Error fetching attendance report:', err);
                return res.status(500).json({ success: false, message: 'Error fetching attendance report', error: err.message });
            }
            
            const groupedReport = report.reduce((acc, record) => {
                const key = record.session_id;
                if (!acc[key]) {
                    acc[key] = {
                        session_name: record.session_name,
                        course_name: record.course_name,
                        records: [],
                    };
                }
                acc[key].records.push({
                    attendance_date: record.attendance_date,
                    student_name: record.student_name,
                    attendance_status: record.attendance_status,
                    added_user: record.added_user,
                    added_time: record.added_time,
                });
                return acc;
            }, {});

            res.json({ success: true, report: Object.values(groupedReport) });
        });
    } catch (error) {
        console.error('Error fetching attendance report:', error);
        res.status(500).json({ success: false, message: 'Error fetching attendance report', error: error.message });
    }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete an attendance record
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    // Check if attendance record exists
    const [attendance] = await db.promise().query('SELECT * FROM attendance WHERE id = ?', [id]);
    
    if (attendance.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    // Delete attendance record from database
    const [result] = await db.promise().query('DELETE FROM attendance WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting attendance record' });
  }
});

module.exports = router; 