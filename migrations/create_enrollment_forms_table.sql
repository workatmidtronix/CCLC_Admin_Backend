-- Create enrollment_forms table to store enrollment form submissions
CREATE TABLE IF NOT EXISTS enrollment_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    form_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Add index for better performance
CREATE INDEX idx_enrollment_forms_student_id ON enrollment_forms(student_id);
CREATE INDEX idx_enrollment_forms_created_at ON enrollment_forms(created_at); 