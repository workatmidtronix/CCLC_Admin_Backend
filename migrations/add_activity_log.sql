-- Add Activity Log table for tracking dashboard activities
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    description TEXT NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for better performance on recent activities query
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_action_type ON activity_log(action_type);
CREATE INDEX idx_activity_log_entity_type ON activity_log(entity_type);

-- Insert some sample activities for demonstration
INSERT INTO activity_log (action_type, entity_type, description, details) VALUES
('student_enrollment', 'student', 'New student enrolled in course', '{"student_name": "John Doe", "course": "Web Development"}'),
('course_creation', 'course', 'New course created', '{"course_name": "Data Science Basics", "instructor": "Dr. Jane Wilson"}'),
('grade_update', 'grade', 'Grades updated for course', '{"course": "Web Development", "students_updated": 15}'),
('session_scheduled', 'session', 'New session scheduled', '{"session_name": "Morning EKG Session", "date": "2024-01-15"}'),
('instructor_assignment', 'instructor', 'Instructor assigned to course', '{"instructor": "Mike Johnson", "course": "JavaScript Fundamentals"}'); 