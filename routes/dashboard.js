const express = require('express');
const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const db = req.app.locals.db;

    try {
      // Get real data from database
      const [studentsResult] = await db.promise().query('SELECT COUNT(*) as count FROM students WHERE status = "Active"');
      const [instructorsResult] = await db.promise().query('SELECT COUNT(*) as count FROM instructors WHERE status = "Active"');
      const [coursesResult] = await db.promise().query('SELECT COUNT(*) as count FROM courses WHERE status = "Active"');
      const [sessionsResult] = await db.promise().query('SELECT COUNT(*) as count FROM sessions WHERE status = "Scheduled"');

      // Get additional stats
      // const [enrollmentsResult] = await db.promise().query('SELECT COUNT(*) as count FROM student_enrollments WHERE status = "Enrolled"');
      const [applicationsResult] = await db.promise().query('SELECT COUNT(*) as count FROM students WHERE status = "Pending"');
      
      const stats = {
        totalStudents: studentsResult[0].count,
        totalInstructors: instructorsResult[0].count,
        totalCourses: coursesResult[0].count,
        totalSessions: sessionsResult[0].count,
        // totalEnrollments: enrollmentsResult[0].count,
        pendingApplications: applicationsResult[0].count
      };

      res.json({ success: true, stats });
    } catch (dbError) {
      console.error('Database error in stats:', dbError);
      res.status(500).json({ message: 'Database error while fetching stats' });
    }

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 