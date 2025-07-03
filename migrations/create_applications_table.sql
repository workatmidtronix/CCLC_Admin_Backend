-- Create applications table with all CCLC website form fields
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    date_of_joining DATE,
    date_of_birth DATE,
    address TEXT,
    state_province VARCHAR(100),
    gender ENUM('Male', 'Female', 'Other'),
    religion VARCHAR(100),
    nationality VARCHAR(100),
    course VARCHAR(255),
    department VARCHAR(100),
    student_notes TEXT,
    semester VARCHAR(50),
    session VARCHAR(50),
    social_security_number VARCHAR(20),
    driver_license_number VARCHAR(50),
    student_pcp_info TEXT,
    student_pcp_phone VARCHAR(20),
    emergency_contact_info TEXT,
    emergency_contact_phone VARCHAR(20),
    other_emergency_contact TEXT,
    status ENUM('Pending', 'Active', 'Inactive', 'Approved', 'Rejected', 'Waitlisted') DEFAULT 'Pending',
    course_interest_1 VARCHAR(255),
    days_preferred_1 VARCHAR(100),
    location_preference_1 VARCHAR(100),
    course_interest_2 VARCHAR(255),
    days_preferred_2 VARCHAR(100),
    location_preference_2 VARCHAR(100),
    attended_info_session ENUM('Yes', 'No'),
    filled_out_where VARCHAR(100),
    additional_comments TEXT,
    signature TEXT,
    caseworker_name VARCHAR(255),
    workforce_center VARCHAR(255),
    tara_ita_packet_date DATE,
    info_session_date DATE,
    login_id VARCHAR(100),
    password VARCHAR(255),
    photo_path VARCHAR(500),
    social_security_path VARCHAR(500),
    dl_path VARCHAR(500),
    tara_ita_path VARCHAR(500),
    voucher_dates_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_applications_last_name ON applications(last_name);
CREATE INDEX idx_applications_email_address ON applications(email_address);
CREATE INDEX idx_applications_contact_number ON applications(contact_number);
CREATE INDEX idx_applications_course ON applications(course);
CREATE INDEX idx_applications_session ON applications(session);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at); 