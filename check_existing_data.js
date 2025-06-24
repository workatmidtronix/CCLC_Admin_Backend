const mysql = require('mysql2');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'P@ssword_1234',
  database: 'cclc',
  port: 3306
};

async function checkExistingData() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('Connecting to database...');
    await connection.promise().connect();
    console.log('Connected to database successfully');

    // Check courses
    console.log('\n=== COURSES ===');
    const [courses] = await connection.promise().query('SELECT id, course_name FROM courses LIMIT 5');
    console.table(courses);

    // Check sessions
    console.log('\n=== SESSIONS ===');
    const [sessions] = await connection.promise().query('SELECT id, session_name FROM sessions LIMIT 5');
    console.table(sessions);

    // Check students
    console.log('\n=== STUDENTS ===');
    const [students] = await connection.promise().query('SELECT id, first_name, last_name FROM students LIMIT 5');
    console.table(students);

    // Check instructors
    console.log('\n=== INSTRUCTORS ===');
    const [instructors] = await connection.promise().query('SELECT id, name FROM instructors LIMIT 5');
    console.table(instructors);

  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  } finally {
    connection.end();
  }
}

// Run the script
checkExistingData(); 