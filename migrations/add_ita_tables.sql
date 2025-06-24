-- ITA Master table for managing Independent Training Agreements
CREATE TABLE IF NOT EXISTS ita_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    instructor_id INT,
    agreement_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_hours INT NOT NULL,
    status ENUM('active', 'completed', 'terminated') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL
);

-- ITA Attendance Signed by Student table
CREATE TABLE IF NOT EXISTS ita_attendance_signed (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ita_master_id INT NOT NULL,
    student_id INT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    hours_completed DECIMAL(4,2) DEFAULT 0.00,
    student_signature TEXT,
    student_signature_date TIMESTAMP,
    instructor_signature TEXT,
    instructor_signature_date TIMESTAMP,
    status ENUM('pending', 'signed_by_student', 'signed_by_instructor', 'completed') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ita_master_id) REFERENCES ita_master(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Signed ITA Attendance table (consolidated view)
CREATE TABLE IF NOT EXISTS signed_ita_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ita_master_id INT NOT NULL,
    student_id INT NOT NULL,
    instructor_id INT,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    hours_completed DECIMAL(4,2) DEFAULT 0.00,
    student_signature TEXT,
    student_signature_date TIMESTAMP,
    instructor_signature TEXT,
    instructor_signature_date TIMESTAMP,
    total_hours_accumulated DECIMAL(6,2) DEFAULT 0.00,
    status ENUM('pending', 'signed_by_student', 'signed_by_instructor', 'completed') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ita_master_id) REFERENCES ita_master(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_ita_master_student_id ON ita_master(student_id);
CREATE INDEX idx_ita_master_course_id ON ita_master(course_id);
CREATE INDEX idx_ita_master_status ON ita_master(status);
CREATE INDEX idx_ita_attendance_signed_ita_master_id ON ita_attendance_signed(ita_master_id);
CREATE INDEX idx_ita_attendance_signed_student_id ON ita_attendance_signed(student_id);
CREATE INDEX idx_ita_attendance_signed_session_date ON ita_attendance_signed(session_date);
CREATE INDEX idx_signed_ita_attendance_ita_master_id ON signed_ita_attendance(ita_master_id);
CREATE INDEX idx_signed_ita_attendance_student_id ON signed_ita_attendance(student_id);
CREATE INDEX idx_signed_ita_attendance_session_date ON signed_ita_attendance(session_date);

-- Insert sample data (only if tables are empty)
INSERT IGNORE INTO ita_master (student_id, course_id, instructor_id, agreement_date, start_date, end_date, total_hours, status, notes) VALUES
(1, 1, 1, '2024-01-01', '2024-01-15', '2024-03-15', 120, 'active', 'Web Development ITA Agreement'),
(2, 2, 2, '2024-01-02', '2024-01-16', '2024-04-16', 160, 'active', 'Data Science ITA Agreement'),
(3, 3, 3, '2024-01-03', '2024-01-17', '2024-02-17', 80, 'completed', 'Digital Marketing ITA Agreement');

INSERT IGNORE INTO ita_attendance_signed (ita_master_id, student_id, session_date, start_time, end_time, hours_completed, status, notes) VALUES
(1, 1, '2024-01-15', '09:00:00', '11:00:00', 2.00, 'signed_by_student', 'First session completed'),
(1, 1, '2024-01-16', '09:00:00', '11:00:00', 2.00, 'pending', 'Second session'),
(2, 2, '2024-01-16', '13:00:00', '16:00:00', 3.00, 'signed_by_instructor', 'Lab session completed'),
(3, 3, '2024-01-17', '10:00:00', '12:00:00', 2.00, 'completed', 'Final session');

INSERT IGNORE INTO signed_ita_attendance (ita_master_id, student_id, instructor_id, session_date, start_time, end_time, hours_completed, total_hours_accumulated, status, notes) VALUES
(1, 1, 1, '2024-01-15', '09:00:00', '11:00:00', 2.00, 2.00, 'signed_by_student', 'First session completed'),
(1, 1, 1, '2024-01-16', '09:00:00', '11:00:00', 2.00, 4.00, 'pending', 'Second session'),
(2, 2, 2, '2024-01-16', '13:00:00', '16:00:00', 3.00, 3.00, 'signed_by_instructor', 'Lab session completed'),
(3, 3, 3, '2024-01-17', '10:00:00', '12:00:00', 2.00, 2.00, 'completed', 'Final session'); 