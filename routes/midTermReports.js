const express = require('express');
const router = express.Router();
const { logActivity, ACTIVITY_TYPES } = require('../utils/activityLogger');

// Create midterm_reports table if not exists
const createMidtermReportsTable = (db) => {
  return new Promise((resolve, reject) => {
    const sql = `CREATE TABLE IF NOT EXISTS midterm_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      session_id INT NOT NULL,
      instructor_id INT,
      report_date DATE NOT NULL,
      midterm_score DECIMAL(5,2),
      total_possible_score DECIMAL(5,2),
      percentage_score DECIMAL(5,2),
      grade_letter VARCHAR(2),
      attendance_score DECIMAL(5,2),
      participation_score DECIMAL(5,2),
      assignment_score DECIMAL(5,2),
      quiz_score DECIMAL(5,2),
      lab_score DECIMAL(5,2),
      comments TEXT,
      recommendations TEXT,
      instructor_signature TEXT,
      student_signature TEXT,
      status ENUM('Draft', 'Submitted', 'Reviewed', 'Approved') DEFAULT 'Draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL
    )`;
    
    db.query(sql, (err) => {
      if (err) {
        console.error('Error creating midterm_reports table:', err);
        return reject(err);
      }
      resolve();
    });
  });
};

// @route   GET /api/midterm-reports
// @desc    Get all midterm reports
// @access  Private
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createMidtermReportsTable(db);

    const query = `
      SELECT 
        mr.*,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.email as student_email,
        c.course_name,
        ses.session_name,
        i.name as instructor_name
      FROM midterm_reports mr
      LEFT JOIN students s ON mr.student_id = s.id
      LEFT JOIN courses c ON mr.course_id = c.id
      LEFT JOIN sessions ses ON mr.session_id = ses.id
      LEFT JOIN instructors i ON mr.instructor_id = i.id
      ORDER BY mr.created_at DESC
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching midterm reports:', err);
        return res.status(500).json({ success: false, message: 'Database error while fetching midterm reports' });
      }
      res.json({ success: true, reports: results });
    });
  } catch (error) {
    console.error('Server error in GET /midterm-reports:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching midterm reports' });
  }
});

// @route   GET /api/midterm-reports/:id
// @desc    Get single midterm report by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    await createMidtermReportsTable(db);

    const query = `
      SELECT 
        mr.*,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.email as student_email,
        c.course_name,
        ses.session_name,
        i.name as instructor_name
      FROM midterm_reports mr
      LEFT JOIN students s ON mr.student_id = s.id
      LEFT JOIN courses c ON mr.course_id = c.id
      LEFT JOIN sessions ses ON mr.session_id = ses.id
      LEFT JOIN instructors i ON mr.instructor_id = i.id
      WHERE mr.id = ?
    `;

    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error fetching midterm report:', err);
        return res.status(500).json({ success: false, message: 'Database error while fetching midterm report' });
      }
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'Midterm report not found' });
      }
      res.json({ success: true, report: results[0] });
    });
  } catch (error) {
    console.error('Server error in GET /midterm-reports/:id:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching midterm report' });
  }
});

// @route   POST /api/midterm-reports
// @desc    Create new midterm report
// @access  Private
router.post('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createMidtermReportsTable(db);

    const {
      student_id,
      course_id,
      session_id,
      instructor_id,
      report_date,
      midterm_score,
      total_possible_score,
      percentage_score,
      grade_letter,
      attendance_score,
      participation_score,
      assignment_score,
      quiz_score,
      lab_score,
      comments,
      recommendations,
      instructor_signature,
      student_signature,
      status
    } = req.body;

    // Validate required fields
    if (!student_id || !course_id || !session_id || !report_date) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, Course ID, Session ID, and Report Date are required'
      });
    }

    // Format the report_date to extract just the date part
    let formattedReportDate = report_date;
    if (report_date && report_date.includes('T')) {
      formattedReportDate = report_date.split('T')[0];
    }

    const query = `
      INSERT INTO midterm_reports (
        student_id, course_id, session_id, instructor_id, report_date,
        midterm_score, total_possible_score, percentage_score, grade_letter,
        attendance_score, participation_score, assignment_score, quiz_score, lab_score,
        comments, recommendations, instructor_signature, student_signature, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      student_id, course_id, session_id, instructor_id, formattedReportDate,
      midterm_score || null, total_possible_score || null, percentage_score || null, grade_letter || null,
      attendance_score || null, participation_score || null, assignment_score || null, quiz_score || null, lab_score || null,
      comments || null, recommendations || null, instructor_signature || null, student_signature || null, status || 'Draft'
    ];

    db.query(query, values, async (err, result) => {
      if (err) {
        console.error('Error creating midterm report:', err);
        return res.status(500).json({ success: false, message: 'Error creating midterm report' });
      }

      // Log activity
      try {
        await logActivity(db, {
          userId: req.user ? req.user.id : null,
          actionType: ACTIVITY_TYPES.CREATE,
          entityType: 'midterm_report',
          description: `Created midterm report for student ID ${student_id}`,
          details: { report_id: result.insertId, student_id, course_id, session_id }
        });
      } catch (logError) {
        console.error('Error logging activity:', logError);
      }

      res.status(201).json({ 
        success: true, 
        message: 'Midterm report created successfully', 
        report_id: result.insertId 
      });
    });
  } catch (error) {
    console.error('Server error in POST /midterm-reports:', error);
    res.status(500).json({ success: false, message: 'Server error while creating midterm report' });
  }
});

// @route   PUT /api/midterm-reports/:id
// @desc    Update midterm report
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    await createMidtermReportsTable(db);

    const {
      student_id,
      course_id,
      session_id,
      instructor_id,
      report_date,
      midterm_score,
      total_possible_score,
      percentage_score,
      grade_letter,
      attendance_score,
      participation_score,
      assignment_score,
      quiz_score,
      lab_score,
      comments,
      recommendations,
      instructor_signature,
      student_signature,
      status
    } = req.body;

    // Check if report exists
    const checkQuery = 'SELECT id FROM midterm_reports WHERE id = ?';
    db.query(checkQuery, [id], (err, existingReport) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      if (existingReport.length === 0) {
        return res.status(404).json({ success: false, message: 'Midterm report not found' });
      }

      // Format the report_date to extract just the date part
      let formattedReportDate = report_date;
      if (report_date && report_date.includes('T')) {
        formattedReportDate = report_date.split('T')[0];
      }

      const query = `
        UPDATE midterm_reports SET 
          student_id = ?, course_id = ?, session_id = ?, instructor_id = ?, report_date = ?,
          midterm_score = ?, total_possible_score = ?, percentage_score = ?, grade_letter = ?,
          attendance_score = ?, participation_score = ?, assignment_score = ?, quiz_score = ?, lab_score = ?,
          comments = ?, recommendations = ?, instructor_signature = ?, student_signature = ?, status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const values = [
        student_id, course_id, session_id, instructor_id, formattedReportDate,
        midterm_score || null, total_possible_score || null, percentage_score || null, grade_letter || null,
        attendance_score || null, participation_score || null, assignment_score || null, quiz_score || null, lab_score || null,
        comments || null, recommendations || null, instructor_signature || null, student_signature || null, status || 'Draft',
        id
      ];

      db.query(query, values, async (err, result) => {
        if (err) {
          console.error('Error updating midterm report:', err);
          return res.status(500).json({ success: false, message: 'Error updating midterm report' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Midterm report not found' });
        }

        // Log activity
        try {
          await logActivity(db, {
            userId: req.user ? req.user.id : null,
            actionType: ACTIVITY_TYPES.UPDATE,
            entityType: 'midterm_report',
            description: `Updated midterm report ID ${id}`,
            details: { report_id: id, student_id, course_id, session_id }
          });
        } catch (logError) {
          console.error('Error logging activity:', logError);
        }

        res.json({ success: true, message: 'Midterm report updated successfully' });
      });
    });
  } catch (error) {
    console.error('Server error in PUT /midterm-reports/:id:', error);
    res.status(500).json({ success: false, message: 'Server error while updating midterm report' });
  }
});

// @route   DELETE /api/midterm-reports/:id
// @desc    Delete midterm report
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    await createMidtermReportsTable(db);

    // Check if report exists
    const [report] = await db.promise().query('SELECT * FROM midterm_reports WHERE id = ?', [id]);
    
    if (report.length === 0) {
      return res.status(404).json({ success: false, message: 'Midterm report not found' });
    }

    // Delete report from database
    const [result] = await db.promise().query('DELETE FROM midterm_reports WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Midterm report not found' });
    }

    // Log activity
    try {
      await logActivity(db, {
        userId: req.user ? req.user.id : null,
        actionType: ACTIVITY_TYPES.DELETE,
        entityType: 'midterm_report',
        description: `Deleted midterm report ID ${id}`,
        details: { report_id: id, student_id: report[0].student_id }
      });
    } catch (logError) {
      console.error('Error logging activity:', logError);
    }

    res.json({ success: true, message: 'Midterm report deleted successfully' });
  } catch (error) {
    console.error('Error deleting midterm report:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting midterm report' });
  }
});

module.exports = router;
