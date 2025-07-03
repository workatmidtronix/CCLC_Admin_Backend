-- Create students_vouchers table
CREATE TABLE IF NOT EXISTS students_vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    referring_wia_provider VARCHAR(255),
    case_manager_name VARCHAR(255),
    case_manager_telephone VARCHAR(20),
    training_provider VARCHAR(255),
    instructor_name VARCHAR(255),
    program_name VARCHAR(255),
    training_period_start_date DATE,
    training_period_end_date DATE,
    voucher_file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    INDEX idx_student_id (student_id)
); 