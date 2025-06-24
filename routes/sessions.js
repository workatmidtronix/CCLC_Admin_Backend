const express = require('express');
const router = express.Router();

// GET all sessions
router.get('/', (req, res) => {
  const db = req.app.locals.db;

  const query = `
    SELECT 
      s.*,
      c.course_name,
      c.course_code,
      i.name as instructor_name
    FROM sessions s
    LEFT JOIN courses c ON s.course_id = c.id
    LEFT JOIN instructors i ON c.instructor_id = i.id
    ORDER BY s.session_date DESC, s.start_time ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching sessions:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, sessions: results });
  });
});

// GET single session by ID
router.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  const query = `
    SELECT 
      s.*,
      c.course_name,
      c.course_code,
      i.name as instructor_name
    FROM sessions s
    LEFT JOIN courses c ON s.course_id = c.id
    LEFT JOIN instructors i ON c.instructor_id = i.id
    WHERE s.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching session:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.json({ success: true, session: results[0] });
  });
});

// POST create new session
router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const {
    courseId,
    sessionName,
    sessionDate,
    startTime,
    endTime,
    room,
    notes,
    status
  } = req.body;

  // Validate required fields
  if (!courseId) {
    return res.status(400).json({
      success: false,
      message: 'Course ID is required'
    });
  }

  if (!sessionDate) {
    return res.status(400).json({
      success: false,
      message: 'Session date is required'
    });
  }

  // Check if course exists
  const courseCheckQuery = 'SELECT id FROM courses WHERE id = ?';
  db.query(courseCheckQuery, [courseId], (err, courseExists) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    if (courseExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Course not found'
      });
    }

    const query = `
      INSERT INTO sessions (
        course_id, session_name, session_date, start_time, 
        end_time, room, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      courseId,
      sessionName || null,
      sessionDate,
      startTime || null,
      endTime || null,
      room || null,
      notes || null,
      status || 'Scheduled'
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error adding session:', err);
        return res.status(500).json({ success: false, message: 'Error adding session' });
      }
      res.status(201).json({ success: true, message: 'Session added successfully', sessionId: result.insertId });
    });
  });
});

// PUT update session
router.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const {
    courseId,
    sessionName,
    sessionDate,
    startTime,
    endTime,
    room,
    notes,
    status
  } = req.body;

  // Check if session exists
  const checkQuery = 'SELECT id FROM sessions WHERE id = ?';
  db.query(checkQuery, [id], (err, existingSession) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    if (existingSession.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Check if course exists (if courseId is being updated)
    if (courseId) {
      const courseCheckQuery = 'SELECT id FROM courses WHERE id = ?';
      db.query(courseCheckQuery, [courseId], (err, courseExists) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Server error' });
        }
        if (courseExists.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Course not found'
          });
        }

        const query = `
          UPDATE sessions SET 
            course_id = ?, session_name = ?, session_date = ?, start_time = ?,
            end_time = ?, room = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        const values = [
          courseId,
          sessionName || null,
          sessionDate,
          startTime || null,
          endTime || null,
          room || null,
          notes || null,
          status || 'Scheduled',
          id
        ];

        db.query(query, values, (err, result) => {
          if (err) {
            console.error('Error updating session:', err);
            return res.status(500).json({ success: false, message: 'Error updating session' });
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Session not found' });
          }
          res.json({ success: true, message: 'Session updated successfully' });
        });
      });
    } else {
      const query = `
        UPDATE sessions SET 
          session_name = ?, session_date = ?, start_time = ?,
          end_time = ?, room = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const values = [
        sessionName || null,
        sessionDate,
        startTime || null,
        endTime || null,
        room || null,
        notes || null,
        status || 'Scheduled',
        id
      ];

      db.query(query, values, (err, result) => {
        if (err) {
          console.error('Error updating session:', err);
          return res.status(500).json({ success: false, message: 'Error updating session' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Session not found' });
        }
        res.json({ success: true, message: 'Session updated successfully' });
      });
    }
  });
});

// DELETE session
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = req.app.locals.db;

  // Check if session exists
  const checkQuery = 'SELECT id FROM sessions WHERE id = ?';
  db.query(checkQuery, [id], (err, existingSession) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    if (existingSession.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Check if session has attendance records (with error handling)
    const attendanceQuery = 'SELECT id FROM attendance WHERE session_id = ?';
    db.query(attendanceQuery, [id], (err, attendance) => {
      if (err) {
        console.log('Attendance table check failed, proceeding with session deletion:', err.message);
      } else if (attendance.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete session with attendance records. Please delete attendance first.'
        });
      }

      const deleteQuery = 'DELETE FROM sessions WHERE id = ?';
      db.query(deleteQuery, [id], (err, result) => {
        if (err) {
          console.error('Error deleting session:', err);
          return res.status(500).json({ success: false, message: 'Error deleting session' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Session not found' });
        }
        res.json({ success: true, message: 'Session deleted successfully' });
      });
    });
  });
});

// GET courses for dropdown
router.get('/courses/list', (req, res) => {
  const db = req.app.locals.db;

  const query = `
    SELECT id, course_name, course_code, status
    FROM courses 
    WHERE status = 'Active'
    ORDER BY course_name
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching courses:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, courses: results });
  });
});

// GET sessions by course ID
router.get('/course/:courseId', (req, res) => {
  const db = req.app.locals.db;
  const { courseId } = req.params;

  const query = `
    SELECT 
      s.*,
      c.course_name,
      c.course_code
    FROM sessions s
    LEFT JOIN courses c ON s.course_id = c.id
    WHERE s.course_id = ?
    ORDER BY s.session_date ASC, s.start_time ASC
  `;

  db.query(query, [courseId], (err, results) => {
    if (err) {
      console.error('Error fetching course sessions:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, sessions: results });
  });
});

module.exports = router; 