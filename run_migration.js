const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "P@ssword_1234",
  database: "cclc",
  port: 3306,
};

async function runMigration() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('Connecting to database...');
    await connection.promise().connect();
    console.log('Connected to database successfully');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add_activity_log.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL file into individual statements and clean them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt + ';'); // Add semicolon back
    
    console.log('Running migration statements...');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() && statement !== ';') {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        console.log('Statement:', statement.substring(0, 100) + '...');
        
        try {
          await connection.promise().query(statement);
          console.log(`Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`Error executing statement ${i + 1}:`, error.message);
          // Continue with next statement
        }
      }
    }
    
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    connection.end();
  }
}

runMigration(); 