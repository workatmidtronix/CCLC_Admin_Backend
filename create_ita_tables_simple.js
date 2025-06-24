const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'P@ssword_1234',
    database: process.env.DB_NAME || 'cclc',
    port: process.env.DB_PORT || 3306
};

async function createITATables() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database successfully');

        // Read the SQL file
        const sqlPath = path.join(__dirname, 'create_ita_tables_manual.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('Creating ITA tables...');

        // Split and execute each statement
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`Executing statement ${i + 1}/${statements.length}...`);
                    await connection.execute(statement);
                    console.log(`Statement ${i + 1} executed successfully`);
                } catch (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        console.log(`Sample data already exists, skipping: ${error.message}`);
                    } else {
                        console.error(`Error executing statement ${i + 1}:`, error.message);
                    }
                }
            }
        }

        console.log('ITA tables created successfully!');

        // Verify tables were created
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('ita_master', 'ita_attendance_signed', 'signed_ita_attendance')
        `, [dbConfig.database]);

        console.log('Created tables:', tables.map(t => t.TABLE_NAME));

        // Show sample data
        const [itaMasterCount] = await connection.execute('SELECT COUNT(*) as count FROM ita_master');
        const [itaAttendanceCount] = await connection.execute('SELECT COUNT(*) as count FROM ita_attendance_signed');
        const [signedAttendanceCount] = await connection.execute('SELECT COUNT(*) as count FROM signed_ita_attendance');

        console.log(`Sample data inserted:`);
        console.log(`- ITA Master: ${itaMasterCount[0].count} records`);
        console.log(`- ITA Attendance Signed: ${itaAttendanceCount[0].count} records`);
        console.log(`- Signed ITA Attendance: ${signedAttendanceCount[0].count} records`);

    } catch (error) {
        console.error('Error creating ITA tables:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run the script
createITATables(); 