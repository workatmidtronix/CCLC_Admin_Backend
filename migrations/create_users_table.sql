-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login_id VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert admin user
INSERT INTO users (login_id, password, role, first_name, last_name, email, status) 
VALUES ('cclc_admin', 'P@ssword_123', 'admin', 'CCLC', 'Administrator', 'admin@cclc.org', 'active');

-- Insert staff user
INSERT INTO users (login_id, password, role, first_name, last_name, email, status) 
VALUES ('cclc_staff', 'P@ssword_123', 'staff', 'CCLC', 'Staff', 'staff@cclc.org', 'active'); 