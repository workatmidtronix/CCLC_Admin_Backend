const express = require('express');
const router = express.Router();

// @route   GET /api/attendance-reports
// @desc    Get all attendance reports
// @access  Private
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const query = `
      SELECT 
        ar.*,
        c.course_name,
        s.session_name,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        i.name AS instructor_name
      FROM attendance_reports ar
      LEFT JOIN courses c ON ar.course_id = c.id
      LEFT JOIN sessions s ON ar.session_id = s.id
      LEFT JOIN students st ON ar.student_id = st.id
      LEFT JOIN instructors i ON ar.instructor_id = i.id
      ORDER BY ar.report_date DESC, ar.created_at DESC
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching attendance reports:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching attendance reports',
          error: err.message 
        });
      }
      
      res.json({ 
        success: true, 
        reports: results 
      });
    });
  } catch (error) {
    console.error('Error fetching attendance reports:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching attendance reports' 
    });
  }
});

// @route   GET /api/attendance-reports/:id
// @desc    Get attendance report by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    const query = `
      SELECT 
        ar.*,
        c.course_name,
        s.session_name,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        i.name AS instructor_name
      FROM attendance_reports ar
      LEFT JOIN courses c ON ar.course_id = c.id
      LEFT JOIN sessions s ON ar.session_id = s.id
      LEFT JOIN students st ON ar.student_id = st.id
      LEFT JOIN instructors i ON ar.instructor_id = i.id
      WHERE ar.id = ?
    `;
    
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error fetching attendance report:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching attendance report',
          error: err.message 
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Attendance report not found' 
        });
      }
      
      res.json({ 
        success: true, 
        report: results[0] 
      });
    });
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching attendance report' 
    });
  }
});

// @route   POST /api/attendance-reports
// @desc    Create a new attendance report
// @access  Private
router.post('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const {
      course_id,
      session_id,
      student_id,
      instructor_id,
      report_date,
      absent_count,
      absent_with_excuse,
      absent_without_excuse,
      date_time1,
      date_time2,
      date_time3,
      decision,
      instructor_signature,
      report_status,
      notes
    } = req.body;

    // Validate required fields
    if (!course_id || !session_id || !student_id || !report_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: course_id, session_id, student_id, report_date'
      });
    }

    // Format the report_date to extract just the date part
    let formattedReportDate = report_date;
    if (report_date && report_date.includes('T')) {
      formattedReportDate = report_date.split('T')[0];
    }

    const query = `
      INSERT INTO attendance_reports (
        course_id, session_id, student_id, instructor_id, report_date,
        absent_count, absent_with_excuse, absent_without_excuse,
        date_time1, date_time2, date_time3, decision, instructor_signature,
        report_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      course_id, session_id, student_id, instructor_id, formattedReportDate,
      absent_count || 0, absent_with_excuse || 0, absent_without_excuse || 0,
      date_time1, date_time2, date_time3, decision, instructor_signature,
      report_status || 'Draft', notes
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error creating attendance report:', err);
        return res.status(500).json({
          success: false,
          message: 'Error creating attendance report',
          error: err.message
        });
      }

      res.status(201).json({
        success: true,
        message: 'Attendance report created successfully',
        reportId: result.insertId
      });
    });
  } catch (error) {
    console.error('Error creating attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating attendance report'
    });
  }
});

// @route   PUT /api/attendance-reports/:id
// @desc    Update an attendance report
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const {
      course_id,
      session_id,
      student_id,
      instructor_id,
      report_date,
      absent_count,
      absent_with_excuse,
      absent_without_excuse,
      date_time1,
      date_time2,
      date_time3,
      decision,
      instructor_signature,
      report_status,
      notes
    } = req.body;

    // Check if report exists
    const [existingReport] = await db.promise().query(
      'SELECT * FROM attendance_reports WHERE id = ?',
      [id]
    );

    if (existingReport.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance report not found'
      });
    }

    // Format the report_date to extract just the date part
    let formattedReportDate = report_date;
    if (report_date && report_date.includes('T')) {
      formattedReportDate = report_date.split('T')[0];
    }

    const query = `
      UPDATE attendance_reports SET
        course_id = ?, session_id = ?, student_id = ?, instructor_id = ?,
        report_date = ?, absent_count = ?, absent_with_excuse = ?, absent_without_excuse = ?,
        date_time1 = ?, date_time2 = ?, date_time3 = ?, decision = ?,
        instructor_signature = ?, report_status = ?, notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      course_id, session_id, student_id, instructor_id, formattedReportDate,
      absent_count || 0, absent_with_excuse || 0, absent_without_excuse || 0,
      date_time1, date_time2, date_time3, decision, instructor_signature,
      report_status || 'Draft', notes, id
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error updating attendance report:', err);
        return res.status(500).json({
          success: false,
          message: 'Error updating attendance report',
          error: err.message
        });
      }

      res.json({
        success: true,
        message: 'Attendance report updated successfully'
      });
    });
  } catch (error) {
    console.error('Error updating attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating attendance report'
    });
  }
});

// @route   DELETE /api/attendance-reports/:id
// @desc    Delete an attendance report
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    // Check if report exists
    const [existingReport] = await db.promise().query(
      'SELECT * FROM attendance_reports WHERE id = ?',
      [id]
    );

    if (existingReport.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance report not found'
      });
    }

    // Delete the report
    const [result] = await db.promise().query(
      'DELETE FROM attendance_reports WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance report not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting attendance report'
    });
  }
});

// @route   GET /api/attendance-reports/student/:studentId
// @desc    Get attendance reports for a specific student
// @access  Private
router.get('/student/:studentId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { studentId } = req.params;
    
    const query = `
      SELECT 
        ar.*,
        c.course_name,
        s.session_name,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        i.name AS instructor_name
      FROM attendance_reports ar
      LEFT JOIN courses c ON ar.course_id = c.id
      LEFT JOIN sessions s ON ar.session_id = s.id
      LEFT JOIN students st ON ar.student_id = st.id
      LEFT JOIN instructors i ON ar.instructor_id = i.id
      WHERE ar.student_id = ?
      ORDER BY ar.report_date DESC, ar.created_at DESC
    `;
    
    db.query(query, [studentId], (err, results) => {
      if (err) {
        console.error('Error fetching student attendance reports:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching student attendance reports',
          error: err.message
        });
      }
      
      res.json({
        success: true,
        reports: results
      });
    });
  } catch (error) {
    console.error('Error fetching student attendance reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student attendance reports'
    });
  }
});

// @route   GET /api/attendance-reports/course/:courseId
// @desc    Get attendance reports for a specific course
// @access  Private
router.get('/course/:courseId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { courseId } = req.params;
    
    const query = `
      SELECT 
        ar.*,
        c.course_name,
        s.session_name,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        i.name AS instructor_name
      FROM attendance_reports ar
      LEFT JOIN courses c ON ar.course_id = c.id
      LEFT JOIN sessions s ON ar.session_id = s.id
      LEFT JOIN students st ON ar.student_id = st.id
      LEFT JOIN instructors i ON ar.instructor_id = i.id
      WHERE ar.course_id = ?
      ORDER BY ar.report_date DESC, ar.created_at DESC
    `;
    
    db.query(query, [courseId], (err, results) => {
      if (err) {
        console.error('Error fetching course attendance reports:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching course attendance reports',
          error: err.message
        });
      }
      
      res.json({
        success: true,
        reports: results
      });
    });
  } catch (error) {
    console.error('Error fetching course attendance reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course attendance reports'
    });
  }
});

module.exports = router; 