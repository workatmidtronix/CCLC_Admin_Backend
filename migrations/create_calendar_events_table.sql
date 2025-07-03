-- Create calendar_events table
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

-- Create indexes for calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_date ON calendar_events(end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
