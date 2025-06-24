/**
 * Activity Logger Utility
 * Logs various activities to the activity_log table for dashboard tracking
 */

const logActivity = async (db, {
  userId = null,
  actionType,
  entityType,
  entityId = null,
  description,
  details = null,
  ipAddress = null,
  userAgent = null
}) => {
  try {
    const query = `
      INSERT INTO activity_log 
      (user_id, action_type, entity_type, entity_id, description, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      userId,
      actionType,
      entityType,
      entityId,
      description,
      details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent
    ];

    await db.promise().query(query, values);
    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
};

// Predefined activity types for consistency
const ACTIVITY_TYPES = {
  STUDENT_ENROLLMENT: 'student_enrollment',
  STUDENT_UPDATE: 'student_update',
  STUDENT_DELETE: 'student_delete',
  COURSE_CREATION: 'course_creation',
  COURSE_UPDATE: 'course_update',
  COURSE_DELETE: 'course_delete',
  SESSION_SCHEDULED: 'session_scheduled',
  SESSION_UPDATE: 'session_update',
  SESSION_CANCELLED: 'session_cancelled',
  INSTRUCTOR_ASSIGNMENT: 'instructor_assignment',
  INSTRUCTOR_UPDATE: 'instructor_update',
  GRADE_UPDATE: 'grade_update',
  ATTENDANCE_RECORDED: 'attendance_recorded',
  APPLICATION_SUBMITTED: 'application_submitted',
  APPLICATION_REVIEWED: 'application_reviewed',
  STAFF_ADDED: 'staff_added',
  STAFF_UPDATE: 'staff_update',
  CALENDAR_EVENT_CREATED: 'calendar_event_created',
  CALENDAR_EVENT_UPDATED: 'calendar_event_updated',
  CALENDAR_EVENT_DELETED: 'calendar_event_deleted',
  LOGIN: 'login',
  LOGOUT: 'logout'
};

module.exports = {
  logActivity,
  ACTIVITY_TYPES
}; 