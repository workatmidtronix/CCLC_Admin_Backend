const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration - matching server.js
const dbConfig = {
  host: "162.240.35.90",
  user: "cclcusa_cclc",
  password: "CCLC@IP840!",
  database: "cclcusa_db",
  port: 3306
};

async function runAttendanceMigration() {
  let connection;
  
  try {
    console.log('Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database successfully');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'migrations', 'create_attendance_table.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing attendance table migration...');
    
    // Split the SQL content into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
        console.log('Executed statement:', statement.trim().substring(0, 50) + '...');
      }
    }
    
    console.log('Attendance table migration completed successfully!');
    
    // Verify the table was created
    const [tables] = await connection.execute('SHOW TABLES LIKE "attendance"');
    if (tables.length > 0) {
      console.log('✅ Attendance table created successfully');
      
      // Show table structure
      const [columns] = await connection.execute('DESCRIBE attendance');
      console.log('Attendance table structure:');
      console.table(columns);
    } else {
      console.log('❌ Attendance table was not created');
    }
    
  } catch (error) {
    console.error('Error running attendance migration:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

runAttendanceMigration(); 