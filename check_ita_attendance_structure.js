const mysql = require('mysql2/promise');

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "P@ssword_1234",
    database: "cclc",
    port: 3306
};

async function checkITAAttendanceStructure() {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database successfully\n');

        console.log('=== CHECKING ITA_ATTENDANCE_SIGNED TABLE ===');
        const [columns] = await connection.execute('DESCRIBE ita_attendance_signed');
        console.table(columns);

        console.log('\n=== SAMPLE ITA ATTENDANCE DATA ===');
        const [rows] = await connection.execute('SELECT * FROM ita_attendance_signed LIMIT 3');
        console.table(rows);

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkITAAttendanceStructure(); 