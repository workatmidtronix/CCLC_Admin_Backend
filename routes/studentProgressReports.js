const express = require('express');
const router = express.Router();

// @route   GET /api/student-progress-reports
// @desc    Get all student progress reports
// @access  Private
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const query = `
      SELECT 
        spr.*,
        c.course_name,
        s.session_name,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        i.name AS instructor_name
      FROM student_progress_reports spr
      LEFT JOIN courses c ON spr.course_id = c.id
      LEFT JOIN sessions s ON spr.session_id = s.id
      LEFT JOIN students st ON spr.student_id = st.id
      LEFT JOIN instructors i ON spr.instructor_id = i.id
      ORDER BY spr.date_of_report DESC, spr.created_at DESC
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching student progress reports:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching student progress reports',
          error: err.message 
        });
      }
      
      res.json({ 
        success: true, 
        reports: results 
      });
    });
  } catch (error) {
    console.error('Error fetching student progress reports:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching student progress reports' 
    });
  }
});

// @route   GET /api/student-progress-reports/:id
// @desc    Get student progress report by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    const query = `
      SELECT 
        spr.*,
        c.course_name,
        s.session_name,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        i.name AS instructor_name
      FROM student_progress_reports spr
      LEFT JOIN courses c ON spr.course_id = c.id
      LEFT JOIN sessions s ON spr.session_id = s.id
      LEFT JOIN students st ON spr.student_id = st.id
      LEFT JOIN instructors i ON spr.instructor_id = i.id
      WHERE spr.id = ?
    `;
    
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error fetching student progress report:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching student progress report',
          error: err.message 
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student progress report not found' 
        });
      }
      
      res.json({ 
        success: true, 
        report: results[0] 
      });
    });
  } catch (error) {
    console.error('Error fetching student progress report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching student progress report' 
    });
  }
});

// @route   POST /api/student-progress-reports
// @desc    Create a new student progress report
// @access  Private
router.post('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const {
      course_id,
      session_id,
      student_id,
      instructor_id,
      type_of_progress_report,
      date_of_report,
      problem_area,
      student_goals,
      conference_with_spencer,
      comments,
      date_given_to_student,
      date_sent_to_case_manager,
      instructor_signature,
      status
    } = req.body;

    // Validate required fields
    if (!course_id || !session_id || !student_id || !type_of_progress_report || !date_of_report) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: course_id, session_id, student_id, type_of_progress_report, date_of_report'
      });
    }

    // Format the dates to extract just the date part
    let formattedDateOfReport = date_of_report;
    if (date_of_report && date_of_report.includes('T')) {
      formattedDateOfReport = date_of_report.split('T')[0];
    }

    let formattedDateGivenToStudent = date_given_to_student;
    if (date_given_to_student && date_given_to_student.includes('T')) {
      formattedDateGivenToStudent = date_given_to_student.split('T')[0];
    }

    let formattedDateSentToCaseManager = date_sent_to_case_manager;
    if (date_sent_to_case_manager && date_sent_to_case_manager.includes('T')) {
      formattedDateSentToCaseManager = date_sent_to_case_manager.split('T')[0];
    }

    const query = `
      INSERT INTO student_progress_reports (
        course_id, session_id, student_id, instructor_id, type_of_progress_report,
        date_of_report, problem_area, student_goals, conference_with_spencer,
        comments, date_given_to_student, date_sent_to_case_manager, instructor_signature, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      course_id, session_id, student_id, instructor_id, type_of_progress_report,
      formattedDateOfReport, problem_area, student_goals, conference_with_spencer,
      comments, formattedDateGivenToStudent, formattedDateSentToCaseManager, instructor_signature,
      status || 'Draft'
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error creating student progress report:', err);
        return res.status(500).json({
          success: false,
          message: 'Error creating student progress report',
          error: err.message
        });
      }

      res.status(201).json({
        success: true,
        message: 'Student progress report created successfully',
        reportId: result.insertId
      });
    });
  } catch (error) {
    console.error('Error creating student progress report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating student progress report'
    });
  }
});

// @route   PUT /api/student-progress-reports/:id
// @desc    Update a student progress report
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
      type_of_progress_report,
      date_of_report,
      problem_area,
      student_goals,
      conference_with_spencer,
      comments,
      date_given_to_student,
      date_sent_to_case_manager,
      instructor_signature,
      status
    } = req.body;

    // Check if report exists
    const [existingReport] = await db.promise().query(
      'SELECT * FROM student_progress_reports WHERE id = ?',
      [id]
    );

    if (existingReport.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student progress report not found'
      });
    }

    // Format the dates to extract just the date part
    let formattedDateOfReport = date_of_report;
    if (date_of_report && date_of_report.includes('T')) {
      formattedDateOfReport = date_of_report.split('T')[0];
    }

    let formattedDateGivenToStudent = date_given_to_student;
    if (date_given_to_student && date_given_to_student.includes('T')) {
      formattedDateGivenToStudent = date_given_to_student.split('T')[0];
    }

    let formattedDateSentToCaseManager = date_sent_to_case_manager;
    if (date_sent_to_case_manager && date_sent_to_case_manager.includes('T')) {
      formattedDateSentToCaseManager = date_sent_to_case_manager.split('T')[0];
    }

    const query = `
      UPDATE student_progress_reports SET
        course_id = ?, session_id = ?, student_id = ?, instructor_id = ?,
        type_of_progress_report = ?, date_of_report = ?, problem_area = ?,
        student_goals = ?, conference_with_spencer = ?, comments = ?,
        date_given_to_student = ?, date_sent_to_case_manager = ?, instructor_signature = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      course_id, session_id, student_id, instructor_id, type_of_progress_report,
      formattedDateOfReport, problem_area, student_goals, conference_with_spencer,
      comments, formattedDateGivenToStudent, formattedDateSentToCaseManager, instructor_signature,
      status || 'Draft', id
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error updating student progress report:', err);
        return res.status(500).json({
          success: false,
          message: 'Error updating student progress report',
          error: err.message
        });
      }

      res.json({
        success: true,
        message: 'Student progress report updated successfully'
      });
    });
  } catch (error) {
    console.error('Error updating student progress report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating student progress report'
    });
  }
});

// @route   DELETE /api/student-progress-reports/:id
// @desc    Delete a student progress report
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    // Check if report exists
    const [existingReport] = await db.promise().query(
      'SELECT * FROM student_progress_reports WHERE id = ?',
      [id]
    );

    if (existingReport.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student progress report not found'
      });
    }

    // Delete the report
    const [result] = await db.promise().query(
      'DELETE FROM student_progress_reports WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student progress report not found'
      });
    }

    res.json({
      success: true,
      message: 'Student progress report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student progress report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting student progress report'
    });
  }
});

// @route   GET /api/student-progress-reports/student/:studentId
// @desc    Get student progress reports for a specific student
// @access  Private
router.get('/student/:studentId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { studentId } = req.params;
    
    const query = `
      SELECT 
        spr.*,
        c.course_name,
        s.session_name,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        i.name AS instructor_name
      FROM student_progress_reports spr
      LEFT JOIN courses c ON spr.course_id = c.id
      LEFT JOIN sessions s ON spr.session_id = s.id
      LEFT JOIN students st ON spr.student_id = st.id
      LEFT JOIN instructors i ON spr.instructor_id = i.id
      WHERE spr.student_id = ?
      ORDER BY spr.date_of_report DESC, spr.created_at DESC
    `;
    
    db.query(query, [studentId], (err, results) => {
      if (err) {
        console.error('Error fetching student progress reports:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching student progress reports',
          error: err.message
        });
      }
      
      res.json({
        success: true,
        reports: results
      });
    });
  } catch (error) {
    console.error('Error fetching student progress reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student progress reports'
    });
  }
});

// @route   GET /api/student-progress-reports/course/:courseId
// @desc    Get student progress reports for a specific course
// @access  Private
router.get('/course/:courseId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { courseId } = req.params;
    
    const query = `
      SELECT 
        spr.*,
        c.course_name,
        s.session_name,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        i.name AS instructor_name
      FROM student_progress_reports spr
      LEFT JOIN courses c ON spr.course_id = c.id
      LEFT JOIN sessions s ON spr.session_id = s.id
      LEFT JOIN students st ON spr.student_id = st.id
      LEFT JOIN instructors i ON spr.instructor_id = i.id
      WHERE spr.course_id = ?
      ORDER BY spr.date_of_report DESC, spr.created_at DESC
    `;
    
    db.query(query, [courseId], (err, results) => {
      if (err) {
        console.error('Error fetching course student progress reports:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching course student progress reports',
          error: err.message
        });
      }
      
      res.json({
        success: true,
        reports: results
      });
    });
  } catch (error) {
    console.error('Error fetching course student progress reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course student progress reports'
    });
  }
});

module.exports = router; 