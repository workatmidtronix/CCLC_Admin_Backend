const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "P@ssword_1234",
    database: "cclc",
    port: 3306
};

async function runMigration() {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database successfully\n');

        // Read the migration SQL file
        const migrationPath = path.join(__dirname, 'migrations', 'add_student_name_to_ita_attendance.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration: add_student_name_to_ita_attendance.sql');
        console.log('SQL:', migrationSQL);

        // Split the SQL into individual statements
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.trim());
                await connection.execute(statement);
                console.log('✓ Statement executed successfully');
            }
        }

        console.log('\nMigration completed successfully!');
        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error.message);
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists, skipping...');
        }
    }
}

runMigration(); 