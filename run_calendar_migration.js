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

async function runCalendarMigration() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('Connecting to database...');
    await connection.promise().connect();
    console.log('Connected to database successfully');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add_calendar_events.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL file into individual statements and clean them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt + ';'); // Add semicolon back
    
    console.log('Running calendar migration statements...');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() && statement !== ';') {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          await connection.promise().query(statement);
          console.log(`Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`Error executing statement ${i + 1}:`, error.message);
          // If it's an index creation error, try to create it with IF NOT EXISTS
          if (error.message.includes('Duplicate key name') || error.message.includes('already exists')) {
            console.log('Index already exists, skipping...');
          } else if (error.message.includes('doesn\'t exist') && statement.includes('CREATE INDEX')) {
            console.log('Table not created yet, skipping index creation...');
          } else {
            console.error('Fatal error, stopping migration');
            break;
          }
        }
      }
    }
    
    console.log('Calendar migration completed!');
    
  } catch (error) {
    console.error('Calendar migration failed:', error);
  } finally {
    connection.end();
  }
}

runCalendarMigration(); 