const mysql = require('mysql2');

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "P@ssword_1234",
  database: "cclc",
  port: 3306,
});

console.log('Inserting sample data for testing...');

db.connect(async (err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database successfully');

  try {
    // Insert sample instructor
    const [instructors] = await db.promise().query('SELECT COUNT(*) as count FROM instructors');
    if (instructors[0].count === 0) {
      await db.promise().query(`
        INSERT INTO instructors (name, email, contact_number, department, status) 
        VALUES ('John Smith', 'john.smith@cclc.org', '555-0101', 'Computer Science', 'Active')
      `);
      console.log('✅ Sample instructor inserted');
    }

    // Insert sample course
    const [courses] = await db.promise().query('SELECT COUNT(*) as count FROM courses');
    if (courses[0].count === 0) {
      await db.promise().query(`
        INSERT INTO courses (course_name, course_code, description, duration_weeks, max_students, status) 
        VALUES ('Web Development Fundamentals', 'WEB101', 'Introduction to web development', 12, 20, 'Active')
      `);
      console.log('✅ Sample course inserted');
    }

    // Insert sample session
    const [sessions] = await db.promise().query('SELECT COUNT(*) as count FROM sessions');
    if (sessions[0].count === 0) {
      const [courseId] = await db.promise().query('SELECT id FROM courses LIMIT 1');
      if (courseId.length > 0) {
        await db.promise().query(`
          INSERT INTO sessions (course_id, session_name, session_date, start_time, end_time, room, status) 
          VALUES (?, 'Week 1 - Introduction', '2024-01-15', '09:00:00', '12:00:00', 'Room 101', 'Scheduled')
        `, [courseId[0].id]);
        console.log('✅ Sample session inserted');
      }
    }

    // Insert sample student
    const [students] = await db.promise().query('SELECT COUNT(*) as count FROM students');
    if (students[0].count === 0) {
      await db.promise().query(`
        INSERT INTO students (login_id, password, first_name, last_name, email, phone, status) 
        VALUES ('student1', 'password123', 'Alice', 'Johnson', 'alice.johnson@email.com', '555-0202', 'Active')
      `);
      console.log('✅ Sample student inserted');
    }

    console.log('\n✅ Sample data insertion completed!');
    console.log('📝 You can now run the midterm reports test.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.end();
    console.log('Database connection closed');
  }
}); 