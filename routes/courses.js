const express = require('express');
const router = express.Router();

// Fetch all courses
router.get('/', (req, res) => {
  const db = req.app.locals.db;

  const query = `
    SELECT 
      c.*,
      i.name as instructor_name
    FROM courses c
    LEFT JOIN instructors i ON c.instructor_id = i.id
    ORDER BY c.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching courses:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, courses: results });
  });
});

// Fetch single course by ID
router.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  const query = `
    SELECT 
      c.*,
      i.name as instructor_name
    FROM courses c
    LEFT JOIN instructors i ON c.instructor_id = i.id
    WHERE c.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching course:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.json({ success: true, course: results[0] });
  });
});

// Add new course
router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const {
    courseName,
    courseCode,
    description,
    durationWeeks,
    instructorId,
    maxStudents,
    status,
    startDate,
    endDate
  } = req.body;

  // Validate required fields
  if (!courseName) {
    return res.status(400).json({
      success: false,
      message: 'Course name is required'
    });
  }

  const query = `
    INSERT INTO courses (
      course_name, course_code, description, duration_weeks, 
      instructor_id, max_students, status, start_date, end_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    courseName,
    courseCode || null,
    description || null,
    durationWeeks || null,
    instructorId || null,
    maxStudents || 25,
    status || 'Active',
    startDate || null,
    endDate || null
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error adding course:', err);
      return res.status(500).json({ success: false, message: 'Error adding course' });
    }
    res.status(201).json({ success: true, message: 'Course added successfully', courseId: result.insertId });
  });
});

// Update course
router.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const {
    courseName,
    courseCode,
    description,
    durationWeeks,
    instructorId,
    maxStudents,
    status,
    startDate,
    endDate
  } = req.body;

  // Check if course exists
  const checkQuery = 'SELECT id FROM courses WHERE id = ?';
  db.query(checkQuery, [id], (err, existingCourse) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    if (existingCourse.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const query = `
      UPDATE courses SET 
        course_name = ?, course_code = ?, description = ?, duration_weeks = ?,
        instructor_id = ?, max_students = ?, status = ?, start_date = ?, end_date = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      courseName,
      courseCode || null,
      description || null,
      durationWeeks || null,
      instructorId || null,
      maxStudents || 25,
      status || 'Active',
      startDate || null,
      endDate || null,
      id
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error updating course:', err);
        return res.status(500).json({ success: false, message: 'Error updating course' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
      res.json({ success: true, message: 'Course updated successfully' });
    });
  });
});

// DELETE course
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = req.app.locals.db;

  // Check if course exists
  const checkQuery = 'SELECT id FROM courses WHERE id = ?';
  db.query(checkQuery, [id], (err, existingCourse) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    if (existingCourse.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if course has sessions
    const sessionsQuery = 'SELECT id FROM sessions WHERE course_id = ?';
    db.query(sessionsQuery, [id], (err, sessions) => {
      if (err) {
        // If sessions table doesn't exist, we can proceed with deletion
        console.log('Sessions table check failed, proceeding with course deletion:', err.message);
      } else if (sessions.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete course with sessions. Please delete sessions first.'
        });
      }

      // Check if course has student enrollments
      const enrollmentsQuery = 'SELECT id FROM student_enrollments WHERE course_id = ?';
      db.query(enrollmentsQuery, [id], (err, enrollments) => {
        if (err) {
          // If student_enrollments table doesn't exist, we can proceed with deletion
          console.log('Student enrollments table check failed, proceeding with course deletion:', err.message);
        } else if (enrollments.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete course with student enrollments. Please remove enrollments first.'
          });
        }

        // Proceed with deletion
        const deleteQuery = 'DELETE FROM courses WHERE id = ?';
        db.query(deleteQuery, [id], (err, result) => {
          if (err) {
            console.error('Error deleting course:', err);
            return res.status(500).json({ success: false, message: 'Error deleting course' });
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
          }
          res.json({ success: true, message: 'Course deleted successfully' });
        });
      });
    });
  });
});

// GET students for a course
router.get('/:courseId/students', (req, res) => {
  const { courseId } = req.params;
  const db = req.app.locals.db;

  const query = `
    SELECT s.id, s.first_name, s.last_name 
    FROM students s
    JOIN student_enrollments se ON s.id = se.student_id
    WHERE se.course_id = ? AND se.status = 'Enrolled'
  `;

  db.query(query, [courseId], (err, students) => {
    if (err) {
      console.error('Error fetching students for course:', err);
      return res.status(500).json({ success: false, message: 'Error fetching students for course', error: err.message });
    }
    res.json({ success: true, students });
  });
});

// GET instructors for dropdown
router.get('/instructors/list', (req, res) => {
    const db = req.app.locals.db;
    const query = `
      SELECT id, name, qualification as specialization
      FROM instructors 
      WHERE status = 'Active'
      ORDER BY name
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching instructors:', err);
            return res.status(500).json({ success: false, message: 'Error fetching instructors', error: err.message });
        }
        res.json({
            success: true,
            instructors: results
        });
    });
});

module.exports = router; 