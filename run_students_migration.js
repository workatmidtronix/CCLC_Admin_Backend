const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
    host: "162.240.35.90",
    user: "cclcusa_cclc",
    password: "CCLC@IP840!",
    database: "cclcusa_db",
    port: 3306
};

async function runMigration() {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database successfully\n');

        // Read the migration SQL file
        const migrationPath = path.join(__dirname, 'migrations', 'create_students_table.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration: create_students_table.sql');
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
        
        // Verify the students were created
        console.log('\nVerifying students...');
        const [students] = await connection.execute('SELECT id, first_name, last_name, email FROM students');
        console.table(students);

        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            console.log('Students already exist, skipping...');
        }
    }
}

runMigration(); 