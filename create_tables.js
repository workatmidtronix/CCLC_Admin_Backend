const mysql = require('mysql2');

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "P@ssword_1234",
  database: "cclc",
  port: 3306,
};

async function createTables() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('Connecting to database...');
    await connection.promise().connect();
    console.log('Connected to database successfully');
    
    // Create activity_log table
    console.log('Creating activity_log table...');
    await connection.promise().query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action_type VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT,
        description TEXT NOT NULL,
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('activity_log table created successfully');
    
    // Create indexes for activity_log
    console.log('Creating indexes for activity_log...');
    await connection.promise().query('CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at)');
    await connection.promise().query('CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON activity_log(action_type)');
    await connection.promise().query('CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type ON activity_log(entity_type)');
    console.log('activity_log indexes created successfully');
    
    // Insert sample activities
    console.log('Inserting sample activities...');
    await connection.promise().query(`
      INSERT INTO activity_log (action_type, entity_type, description, details) VALUES
      ('student_enrollment', 'student', 'New student enrolled in course', '{"student_name": "John Doe", "course": "Web Development"}'),
      ('course_creation', 'course', 'New course created', '{"course_name": "Data Science Basics", "instructor": "Dr. Jane Wilson"}'),
      ('grade_update', 'grade', 'Grades updated for course', '{"course": "Web Development", "students_updated": 15}'),
      ('session_scheduled', 'session', 'New session scheduled', '{"session_name": "Morning EKG Session", "date": "2024-01-15"}'),
      ('instructor_assignment', 'instructor', 'Instructor assigned to course', '{"instructor": "Mike Johnson", "course": "JavaScript Fundamentals"}')
    `);
    console.log('Sample activities inserted successfully');
    
    // Create calendar_events table
    console.log('Creating calendar_events table...');
    await connection.promise().query(`
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
      )
    `);
    console.log('calendar_events table created successfully');
    
    // Create indexes for calendar_events
    console.log('Creating indexes for calendar_events...');
    await connection.promise().query('CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date)');
    await connection.promise().query('CREATE INDEX IF NOT EXISTS idx_calendar_events_end_date ON calendar_events(end_date)');
    await connection.promise().query('CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type)');
    await connection.promise().query('CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by)');
    console.log('calendar_events indexes created successfully');
    
    // Insert sample calendar events
    console.log('Inserting sample calendar events...');
    await connection.promise().query(`
      INSERT INTO calendar_events (title, description, start_date, end_date, all_day, event_type, color, location) VALUES
      ('Web Development Class', 'Introduction to HTML and CSS', '2024-01-15 09:00:00', '2024-01-15 11:00:00', FALSE, 'class', '#3788d8', 'Room 101'),
      ('Staff Meeting', 'Weekly staff meeting to discuss progress', '2024-01-16 14:00:00', '2024-01-16 15:00:00', FALSE, 'meeting', '#dc3545', 'Conference Room'),
      ('Midterm Exam', 'Web Development midterm examination', '2024-01-18 10:00:00', '2024-01-18 12:00:00', FALSE, 'exam', '#ffc107', 'Room 102'),
      ('Martin Luther King Day', 'School closed for holiday', '2024-01-20 00:00:00', '2024-01-20 23:59:59', TRUE, 'holiday', '#28a745', 'School-wide'),
      ('Data Science Lab', 'Python programming lab session', '2024-01-22 13:00:00', '2024-01-22 16:00:00', FALSE, 'class', '#17a2b8', 'Computer Lab')
    `);
    console.log('Sample calendar events inserted successfully');
    
    console.log('All tables created successfully!');
    
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    connection.end();
  }
}

createTables(); 