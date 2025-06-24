const mysql = require('mysql2');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'P@ssword_1234',
  database: 'cclc',
  port: 3306
};

async function insertSampleData() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('Connecting to database...');
    await connection.promise().connect();
    console.log('Connected to database successfully');

    // Sample data for student progress reports
    const sampleReports = [
      {
        course_id: 4, // Test Course 1
        session_id: 5, // Test-Session-1
        student_id: 21, // Test One
        instructor_id: 1, // M Malik
        type_of_progress_report: 'Weekly',
        date_of_report: '2024-01-15',
        problem_area: 'Student needs improvement in clinical skills',
        student_goals: 'Improve patient communication and clinical procedures',
        conference_with_spencer: 'Discussed progress and areas for improvement',
        comments: 'Student shows good potential with proper guidance',
        date_given_to_student: '2024-01-16',
        date_sent_to_case_manager: '2024-01-17',
        instructor_signature: 'M Malik',
        status: 'Submitted'
      },
      {
        course_id: 4, // Test Course 1
        session_id: 5, // Test-Session-1
        student_id: 21, // Test One
        instructor_id: 2, // M Malik
        type_of_progress_report: 'Biweekly',
        date_of_report: '2024-01-20',
        problem_area: 'Time management during practical sessions',
        student_goals: 'Complete tasks within allocated time frames',
        conference_with_spencer: 'Reviewed time management strategies',
        comments: 'Student is making steady progress',
        date_given_to_student: '2024-01-21',
        date_sent_to_case_manager: '2024-01-22',
        instructor_signature: 'M Malik',
        status: 'Reviewed'
      },
      {
        course_id: 4, // Test Course 1
        session_id: 5, // Test-Session-1
        student_id: 21, // Test One
        instructor_id: 1, // M Malik
        type_of_progress_report: 'Monthly',
        date_of_report: '2024-01-25',
        problem_area: 'Theoretical knowledge gaps',
        student_goals: 'Strengthen understanding of medical terminology',
        conference_with_spencer: 'Planned additional study sessions',
        comments: 'Student is dedicated and willing to learn',
        date_given_to_student: '2024-01-26',
        date_sent_to_case_manager: '2024-01-27',
        instructor_signature: 'M Malik',
        status: 'Approved'
      }
    ];

    console.log('Inserting sample student progress reports...');
    
    for (const report of sampleReports) {
      const query = `
        INSERT INTO student_progress_reports (
          course_id, session_id, student_id, instructor_id, type_of_progress_report,
          date_of_report, problem_area, student_goals, conference_with_spencer,
          comments, date_given_to_student, date_sent_to_case_manager, instructor_signature, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        report.course_id,
        report.session_id,
        report.student_id,
        report.instructor_id,
        report.type_of_progress_report,
        report.date_of_report,
        report.problem_area,
        report.student_goals,
        report.conference_with_spencer,
        report.comments,
        report.date_given_to_student,
        report.date_sent_to_case_manager,
        report.instructor_signature,
        report.status
      ];

      await connection.promise().query(query, values);
      console.log(`✅ Inserted report for student ${report.student_id}`);
    }

    console.log('✅ Sample student progress reports inserted successfully!');
    
    // Verify the data was inserted
    const [results] = await connection.promise().query(`
      SELECT 
        spr.*,
        c.course_name,
        s.session_name,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        i.name AS instructor_name
      FROM student_progress_reports spr
      LEFT JOIN courses c ON spr.course_id = c.id
      LEFT JOIN sessions s ON spr.session_id = s.id
      LEFT JOIN students st ON spr.student_id = st.id
      LEFT JOIN instructors i ON spr.instructor_id = i.id
      ORDER BY spr.created_at DESC
    `);
    
    console.log('\nInserted reports:');
    console.table(results.map(r => ({
      id: r.id,
      student_name: r.student_name,
      course_name: r.course_name,
      type: r.type_of_progress_report,
      status: r.status,
      date: r.date_of_report
    })));
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      console.log('Note: This error might indicate missing foreign key references (courses, sessions, students, or instructors)');
    }
  } finally {
    connection.end();
  }
}

// Run the script
insertSampleData(); 