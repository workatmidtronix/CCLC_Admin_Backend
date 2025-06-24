const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
    host: '162.240.35.90',
    user: 'cclcusa_cclc',
    password: 'CCLC@IP840!',
    database: 'cclcusa_db',
    port: 3306
};

async function runMigration() {
    let connection;
    
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        
        console.log('Reading migration file...');
        const migrationPath = path.join(__dirname, 'migrations', 'create_sessions_tables.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('Executing migration...');
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.substring(0, 50) + '...');
                await connection.execute(statement);
            }
        }
        
        console.log('✅ Sessions tables migration completed successfully!');
        
        // Verify the tables were created
        console.log('\nVerifying tables...');
        const [tables] = await connection.execute("SHOW TABLES LIKE 'sessions'");
        if (tables.length > 0) {
            console.log('✅ Sessions table created successfully');
        }
        
        const [coursesTables] = await connection.execute("SHOW TABLES LIKE 'courses'");
        if (coursesTables.length > 0) {
            console.log('✅ Courses table created successfully');
        }
        
        const [instructorsTables] = await connection.execute("SHOW TABLES LIKE 'instructors'");
        if (instructorsTables.length > 0) {
            console.log('✅ Instructors table created successfully');
        }
        
        // Check sample data
        const [sessionsCount] = await connection.execute("SELECT COUNT(*) as count FROM sessions");
        console.log(`📊 Sessions count: ${sessionsCount[0].count}`);
        
        const [coursesCount] = await connection.execute("SELECT COUNT(*) as count FROM courses");
        console.log(`📊 Courses count: ${coursesCount[0].count}`);
        
        const [instructorsCount] = await connection.execute("SELECT COUNT(*) as count FROM instructors");
        console.log(`📊 Instructors count: ${instructorsCount[0].count}`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.sql) {
            console.error('SQL Error:', error.sql);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration(); 