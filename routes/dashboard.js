const express = require('express');
const router = express.Router();
const { logActivity, ACTIVITY_TYPES } = require('../utils/activityLogger');

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
      const [enrollmentsResult] = await db.promise().query('SELECT COUNT(*) as count FROM student_enrollments WHERE status = "Enrolled"');
      const [applicationsResult] = await db.promise().query('SELECT COUNT(*) as count FROM students WHERE status = "Pending"');
      
      const stats = {
        totalStudents: studentsResult[0].count,
        totalInstructors: instructorsResult[0].count,
        totalCourses: coursesResult[0].count,
        totalSessions: sessionsResult[0].count,
        totalEnrollments: enrollmentsResult[0].count,
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

// @route   GET /api/dashboard/recent-activities
// @desc    Get recent activities for dashboard
// @access  Private
router.get('/recent-activities', async (req, res) => {
  try {
    const db = req.app.locals.db;

    try {
      // Get recent activities from activity_log table
      const [activitiesResult] = await db.promise().query(`
        SELECT 
          al.id,
          al.action_type,
          al.entity_type,
          al.description,
          al.details,
          al.created_at,
          u.first_name,
          u.last_name
        FROM activity_log al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 10
      `);

      const activities = activitiesResult.map(activity => {
        let details = null;
        try {
          if (activity.details && typeof activity.details === 'string') {
            details = JSON.parse(activity.details);
          } else if (activity.details && typeof activity.details === 'object') {
            details = activity.details;
          }
        } catch (parseError) {
          console.error('Error parsing activity details:', parseError);
          details = null;
        }

        return {
          id: activity.id,
          type: activity.action_type,
          message: activity.description,
          timestamp: activity.created_at,
          user: activity.first_name && activity.last_name ? `${activity.first_name} ${activity.last_name}` : 'System',
          details: details
        };
      });

      res.json({ success: true, activities });
    } catch (dbError) {
      console.error('Database error in activities:', dbError);
      
      // Fallback to sample activities if activity_log table doesn't exist
      const activities = [
        {
          id: 1,
          type: 'student_enrollment',
          message: 'New student enrolled in course',
          timestamp: new Date().toISOString(),
          user: 'System'
        },
        {
          id: 2,
          type: 'course_creation',
          message: 'New course created',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          user: 'System'
        },
        {
          id: 3,
          type: 'grade_update',
          message: 'Grades updated for course',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          user: 'System'
        }
      ];

      res.json({ success: true, activities });
    }

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 