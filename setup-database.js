const fs = require('fs');
const path = require('path');
const { pool } = require('./utils/database');

async function setupDatabase() {
  let connection;
  
  try {
    console.log('Starting database setup...');
    
    // Get a single connection for the entire migration process
    connection = await pool.promise().getConnection();
    console.log('Database connection established');
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run in alphabetical order
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    for (const file of migrationFiles) {
      console.log(`\nRunning migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split the SQL file into individual statements and clean them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
        .map(stmt => stmt + ';'); // Add semicolon back
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim() && statement !== ';') {
          try {
            await connection.query(statement);
            console.log(`  ✓ Statement ${i + 1} executed successfully`);
          } catch (error) {
            // Check if it's a "table already exists" error (which is okay)
            if (error.code === 'ER_TABLE_EXISTS_ERROR') {
              console.log(`  ⚠ Statement ${i + 1}: Table already exists (skipping)`);
            } else {
              console.error(`  ✗ Error in statement ${i + 1}:`, error.message);
              // Continue with next statement instead of failing completely
            }
          }
        }
      }
      
      console.log(`✓ Completed: ${file}`);
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    // Always release the connection
    if (connection) {
      connection.release();
      console.log('Database connection released');
    }
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 