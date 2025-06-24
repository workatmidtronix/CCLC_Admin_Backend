-- Create attendance_reports table
CREATE TABLE attendance_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    instructor_id INT,
    report_date DATE NOT NULL,
    absent_count INT DEFAULT 0,
    absent_with_excuse INT DEFAULT 0,
    absent_without_excuse INT DEFAULT 0,
    date_time1 DATETIME,
    date_time2 DATETIME,
    date_time3 DATETIME,
    decision TEXT,
    instructor_signature TEXT,
    report_status ENUM('Draft', 'Submitted', 'Reviewed', 'Approved') DEFAULT 'Draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL
);

-- Create index for better performance
CREATE INDEX idx_attendance_reports_course ON attendance_reports(course_id);
CREATE INDEX idx_attendance_reports_session ON attendance_reports(session_id);
CREATE INDEX idx_attendance_reports_student ON attendance_reports(student_id);
CREATE INDEX idx_attendance_reports_date ON attendance_reports(report_date); 