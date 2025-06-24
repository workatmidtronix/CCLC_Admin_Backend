const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Database configuration - matching server.js configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'P@ssword_1234',
  database: 'cclc',
  port: 3306,
  multipleStatements: true
};

async function runMigration() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('Connecting to database...');
    await connection.promise().connect();
    console.log('Connected to database successfully');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add_attendance_reports.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running attendance reports migration...');
    
    // Execute the migration
    await connection.promise().query(migrationSQL);
    
    console.log('✅ Attendance reports migration completed successfully!');
    
    // Verify the table was created
    const [tables] = await connection.promise().query('SHOW TABLES LIKE "attendance_reports"');
    if (tables.length > 0) {
      console.log('✅ attendance_reports table created successfully');
      
      // Show table structure
      const [columns] = await connection.promise().query('DESCRIBE attendance_reports');
      console.log('\nTable structure:');
      console.table(columns);
    } else {
      console.log('❌ attendance_reports table was not created');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('Note: This error might indicate the table already exists');
    }
  } finally {
    connection.end();
  }
}

// Run the migration
runMigration(); 