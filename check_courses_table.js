const mysql = require('mysql2/promise');

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "P@ssword_1234",
    database: "cclc",
    port: 3306
};

async function checkCoursesTable() {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database successfully\n');

        console.log('=== CHECKING COURSES TABLE ===');
        const [columns] = await connection.execute('DESCRIBE courses');
        console.table(columns);

        console.log('\n=== SAMPLE COURSES DATA ===');
        const [rows] = await connection.execute('SELECT * FROM courses LIMIT 3');
        console.table(rows);

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkCoursesTable(); 