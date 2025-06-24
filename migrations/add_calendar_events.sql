-- Add Calendar Events table for storing calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    event_type ENUM('class', 'meeting', 'exam', 'holiday', 'other') DEFAULT 'other',
    color VARCHAR(20) DEFAULT '#3788d8',
    location VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance (will be skipped if they already exist)
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_date ON calendar_events(end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);

-- Insert some sample events for demonstration
INSERT INTO calendar_events (title, description, start_date, end_date, all_day, event_type, color, location) VALUES
('Web Development Class', 'Introduction to HTML and CSS', '2024-01-15 09:00:00', '2024-01-15 11:00:00', FALSE, 'class', '#3788d8', 'Room 101'),
('Staff Meeting', 'Weekly staff meeting to discuss progress', '2024-01-16 14:00:00', '2024-01-16 15:00:00', FALSE, 'meeting', '#dc3545', 'Conference Room'),
('Midterm Exam', 'Web Development midterm examination', '2024-01-18 10:00:00', '2024-01-18 12:00:00', FALSE, 'exam', '#ffc107', 'Room 102'),
('Martin Luther King Day', 'School closed for holiday', '2024-01-20 00:00:00', '2024-01-20 23:59:59', TRUE, 'holiday', '#28a745', 'School-wide'),
('Data Science Lab', 'Python programming lab session', '2024-01-22 13:00:00', '2024-01-22 16:00:00', FALSE, 'class', '#17a2b8', 'Computer Lab'); 