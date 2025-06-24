const mysql = require('mysql2/promise');

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'P@ssword_1234',
    database: process.env.DB_NAME || 'cclc',
    port: process.env.DB_PORT || 3306
};

async function createTables() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database successfully');

        // Create ITA Master table
        console.log('Creating ita_master table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS ita_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                course_id INT NOT NULL,
                instructor_id INT,
                agreement_date DATE NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                total_hours INT NOT NULL,
                status ENUM('active', 'completed', 'terminated') DEFAULT 'active',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('ita_master table created successfully');

        // Create ITA Attendance Signed table
        console.log('Creating ita_attendance_signed table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS ita_attendance_signed (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ita_master_id INT NOT NULL,
                student_id INT NOT NULL,
                session_date DATE NOT NULL,
                start_time TIME,
                end_time TIME,
                hours_completed DECIMAL(4,2) DEFAULT 0.00,
                student_signature TEXT,
                student_signature_date TIMESTAMP,
                instructor_signature TEXT,
                instructor_signature_date TIMESTAMP,
                status ENUM('pending', 'signed_by_student', 'signed_by_instructor', 'completed') DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('ita_attendance_signed table created successfully');

        // Create Signed ITA Attendance table
        console.log('Creating signed_ita_attendance table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS signed_ita_attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ita_master_id INT NOT NULL,
                student_id INT NOT NULL,
                instructor_id INT,
                session_date DATE NOT NULL,
                start_time TIME,
                end_time TIME,
                hours_completed DECIMAL(4,2) DEFAULT 0.00,
                student_signature TEXT,
                student_signature_date TIMESTAMP,
                instructor_signature TEXT,
                instructor_signature_date TIMESTAMP,
                total_hours_accumulated DECIMAL(6,2) DEFAULT 0.00,
                status ENUM('pending', 'signed_by_student', 'signed_by_instructor', 'completed') DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('signed_ita_attendance table created successfully');

        // Insert sample data
        console.log('Inserting sample data...');
        
        try {
            await connection.execute(`
                INSERT INTO ita_master (student_id, course_id, instructor_id, agreement_date, start_date, end_date, total_hours, status, notes) VALUES
                (1, 1, 1, '2024-01-01', '2024-01-15', '2024-03-15', 120, 'active', 'Web Development ITA Agreement'),
                (2, 2, 2, '2024-01-02', '2024-01-16', '2024-04-16', 160, 'active', 'Data Science ITA Agreement'),
                (3, 3, 3, '2024-01-03', '2024-01-17', '2024-02-17', 80, 'completed', 'Digital Marketing ITA Agreement')
            `);
            console.log('Sample data inserted into ita_master');
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log('Sample data already exists in ita_master');
            } else {
                console.log('Error inserting sample data into ita_master:', error.message);
            }
        }

        try {
            await connection.execute(`
                INSERT INTO ita_attendance_signed (ita_master_id, student_id, session_date, start_time, end_time, hours_completed, status, notes) VALUES
                (1, 1, '2024-01-15', '09:00:00', '11:00:00', 2.00, 'signed_by_student', 'First session completed'),
                (1, 1, '2024-01-16', '09:00:00', '11:00:00', 2.00, 'pending', 'Second session'),
                (2, 2, '2024-01-16', '13:00:00', '16:00:00', 3.00, 'signed_by_instructor', 'Lab session completed'),
                (3, 3, '2024-01-17', '10:00:00', '12:00:00', 2.00, 'completed', 'Final session')
            `);
            console.log('Sample data inserted into ita_attendance_signed');
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log('Sample data already exists in ita_attendance_signed');
            } else {
                console.log('Error inserting sample data into ita_attendance_signed:', error.message);
            }
        }

        try {
            await connection.execute(`
                INSERT INTO signed_ita_attendance (ita_master_id, student_id, instructor_id, session_date, start_time, end_time, hours_completed, total_hours_accumulated, status, notes) VALUES
                (1, 1, 1, '2024-01-15', '09:00:00', '11:00:00', 2.00, 2.00, 'signed_by_student', 'First session completed'),
                (1, 1, 1, '2024-01-16', '09:00:00', '11:00:00', 2.00, 4.00, 'pending', 'Second session'),
                (2, 2, 2, '2024-01-16', '13:00:00', '16:00:00', 3.00, 3.00, 'signed_by_instructor', 'Lab session completed'),
                (3, 3, 3, '2024-01-17', '10:00:00', '12:00:00', 2.00, 2.00, 'completed', 'Final session')
            `);
            console.log('Sample data inserted into signed_ita_attendance');
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log('Sample data already exists in signed_ita_attendance');
            } else {
                console.log('Error inserting sample data into signed_ita_attendance:', error.message);
            }
        }

        console.log('All ITA tables created successfully!');

        // Verify tables were created
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('ita_master', 'ita_attendance_signed', 'signed_ita_attendance')
        `, [dbConfig.database]);

        console.log('Created tables:', tables.map(t => t.TABLE_NAME));

        // Show sample data counts
        const [itaMasterCount] = await connection.execute('SELECT COUNT(*) as count FROM ita_master');
        const [itaAttendanceCount] = await connection.execute('SELECT COUNT(*) as count FROM ita_attendance_signed');
        const [signedAttendanceCount] = await connection.execute('SELECT COUNT(*) as count FROM signed_ita_attendance');

        console.log(`Sample data counts:`);
        console.log(`- ITA Master: ${itaMasterCount[0].count} records`);
        console.log(`- ITA Attendance Signed: ${itaAttendanceCount[0].count} records`);
        console.log(`- Signed ITA Attendance: ${signedAttendanceCount[0].count} records`);

    } catch (error) {
        console.error('Error creating tables:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run the script
createTables(); 