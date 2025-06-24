-- Create student_progress_reports table
CREATE TABLE student_progress_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    instructor_id INT,
    type_of_progress_report ENUM('Weekly', 'Biweekly', 'Monthly', 'Mid-term', 'Final') NOT NULL,
    date_of_report DATE NOT NULL,
    problem_area TEXT,
    student_goals TEXT,
    conference_with_spencer TEXT,
    comments TEXT,
    date_given_to_student DATE,
    date_sent_to_case_manager DATE,
    instructor_signature TEXT,
    status ENUM('Draft', 'Submitted', 'Reviewed', 'Approved') DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_student_progress_reports_course ON student_progress_reports(course_id);
CREATE INDEX idx_student_progress_reports_session ON student_progress_reports(session_id);
CREATE INDEX idx_student_progress_reports_student ON student_progress_reports(student_id);
CREATE INDEX idx_student_progress_reports_date ON student_progress_reports(date_of_report);
CREATE INDEX idx_student_progress_reports_status ON student_progress_reports(status); 