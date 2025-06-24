-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample students
INSERT INTO students (first_name, last_name, email, phone, status) VALUES
('John', 'Doe', 'john.doe@example.com', '555-1234', 'active'),
('Jane', 'Smith', 'jane.smith@example.com', '555-5678', 'active'),
('Mike', 'Johnson', 'mike.johnson@example.com', '555-9012', 'active'),
('Sarah', 'Williams', 'sarah.williams@example.com', '555-3456', 'active'),
('David', 'Brown', 'david.brown@example.com', '555-7890', 'active'); 