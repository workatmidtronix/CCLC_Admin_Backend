-- Create instructors table
CREATE TABLE IF NOT EXISTS instructors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) UNIQUE,
    description TEXT,
    instructor_id INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id)
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_name VARCHAR(255) NOT NULL,
    course_id INT,
    session_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    max_capacity INT DEFAULT 25,
    current_enrollment INT DEFAULT 0,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Insert sample instructors
INSERT INTO instructors (name, email, status) VALUES
('Dr. Sarah Johnson', 'sarah.johnson@cclc.org', 'active'),
('Prof. Michael Chen', 'michael.chen@cclc.org', 'active'),
('Dr. Emily Rodriguez', 'emily.rodriguez@cclc.org', 'active'),
('Prof. David Thompson', 'david.thompson@cclc.org', 'active'),
('Dr. Lisa Wang', 'lisa.wang@cclc.org', 'active');

-- Insert sample courses
INSERT INTO courses (course_name, course_code, description, instructor_id, status) VALUES
('Web Development Fundamentals', 'WEB101', 'Introduction to web development with HTML, CSS, and JavaScript', 1, 'active'),
('Database Management Systems', 'DB201', 'Learn SQL and database design principles', 2, 'active'),
('Business Administration', 'BUS101', 'Core business concepts and management principles', 3, 'active'),
('Nursing Fundamentals', 'NUR101', 'Basic nursing skills and patient care', 4, 'active'),
('Cybersecurity Basics', 'CS101', 'Introduction to cybersecurity and network security', 5, 'active');

-- Insert sample sessions
INSERT INTO sessions (session_name, course_id, session_date, start_time, end_time, location, max_capacity, current_enrollment, status) VALUES
('Web Dev Session 1', 1, '2024-01-15', '09:00:00', '12:00:00', 'Main Campus - Room 101', 25, 18, 'completed'),
('Web Dev Session 2', 1, '2024-01-22', '09:00:00', '12:00:00', 'Main Campus - Room 101', 25, 20, 'scheduled'),
('Database Session 1', 2, '2024-01-16', '13:00:00', '16:00:00', 'Tech Campus - Room 201', 20, 15, 'completed'),
('Database Session 2', 2, '2024-01-23', '13:00:00', '16:00:00', 'Tech Campus - Room 201', 20, 17, 'scheduled'),
('Business Admin Session 1', 3, '2024-01-17', '10:00:00', '13:00:00', 'Business Campus - Room 301', 30, 22, 'completed'),
('Business Admin Session 2', 3, '2024-01-24', '10:00:00', '13:00:00', 'Business Campus - Room 301', 30, 25, 'scheduled'),
('Nursing Session 1', 4, '2024-01-18', '08:00:00', '11:00:00', 'Medical Campus - Lab 401', 15, 12, 'completed'),
('Nursing Session 2', 4, '2024-01-25', '08:00:00', '11:00:00', 'Medical Campus - Lab 401', 15, 14, 'scheduled'),
('Cybersecurity Session 1', 5, '2024-01-19', '14:00:00', '17:00:00', 'Tech Campus - Room 202', 20, 16, 'completed'),
('Cybersecurity Session 2', 5, '2024-01-26', '14:00:00', '17:00:00', 'Tech Campus - Room 202', 20, 18, 'scheduled'); 