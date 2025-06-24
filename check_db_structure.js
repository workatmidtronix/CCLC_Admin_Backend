const mysql = require('mysql2');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "P@ssword_1234",
    database: "cclc",
    port: 3306,
});

console.log('Checking database structure...');

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    } else {
        console.log('Connected to MySQL database successfully');
        
        // Check what tables exist
        db.query('SHOW TABLES', (err, results) => {
            if (err) {
                console.error('Error showing tables:', err);
            } else {
                console.log('\nExisting tables:');
                results.forEach(row => {
                    const tableName = Object.values(row)[0];
                    console.log('-', tableName);
                });
                
                // Check students table structure
                console.log('\nStudents table structure:');
                db.query('DESCRIBE students', (err, results) => {
                    if (err) {
                        console.error('Error describing students table:', err);
                    } else {
                        results.forEach(row => {
                            console.log(`${row.Field} - ${row.Type} - ${row.Null} - ${row.Key}`);
                        });
                    }
                    
                    // Check if sessions table exists and its structure
                    console.log('\nSessions table structure:');
                    db.query('DESCRIBE sessions', (err, results) => {
                        if (err) {
                            console.log('Sessions table does not exist or error:', err.message);
                        } else {
                            results.forEach(row => {
                                console.log(`${row.Field} - ${row.Type} - ${row.Null} - ${row.Key}`);
                            });
                        }
                        
                        // Check if courses table exists and its structure
                        console.log('\nCourses table structure:');
                        db.query('DESCRIBE courses', (err, results) => {
                            if (err) {
                                console.log('Courses table does not exist or error:', err.message);
                            } else {
                                results.forEach(row => {
                                    console.log(`${row.Field} - ${row.Type} - ${row.Null} - ${row.Key}`);
                                });
                            }
                            
                            // Check if instructors table exists and its structure
                            console.log('\nInstructors table structure:');
                            db.query('DESCRIBE instructors', (err, results) => {
                                if (err) {
                                    console.log('Instructors table does not exist or error:', err.message);
                                } else {
                                    results.forEach(row => {
                                        console.log(`${row.Field} - ${row.Type} - ${row.Null} - ${row.Key}`);
                                    });
                                }
                                
                                // Check if attendance table exists
                                console.log('\nAttendance table structure:');
                                db.query('DESCRIBE attendance', (err, results) => {
                                    if (err) {
                                        console.log('Attendance table does not exist or error:', err.message);
                                    } else {
                                        results.forEach(row => {
                                            console.log(`${row.Field} - ${row.Type} - ${row.Null} - ${row.Key}`);
                                        });
                                    }
                                    
                                    // Check if grades table exists
                                    console.log('\nGrades table structure:');
                                    db.query('DESCRIBE grades', (err, results) => {
                                        if (err) {
                                            console.log('Grades table does not exist or error:', err.message);
                                        } else {
                                            results.forEach(row => {
                                                console.log(`${row.Field} - ${row.Type} - ${row.Null} - ${row.Key}`);
                                            });
                                        }
                                        
                                        console.log('\nDatabase structure check completed.');
                                        db.end();
                                    });
                                });
                            });
                        });
                    });
                });
            }
        });
    }
}); 