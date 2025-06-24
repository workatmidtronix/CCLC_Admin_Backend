const mysql = require('mysql2');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'P@ssword_1234',
  database: 'cclc',
  port: 3306
};

async function checkITATables() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('Connecting to database...');
    await connection.promise().connect();
    console.log('Connected to database successfully');

    // Check if ita_attendance_signed table exists
    console.log('\n=== CHECKING ITA TABLES ===');
    const [tables] = await connection.promise().query('SHOW TABLES LIKE "ita_attendance_signed"');
    
    if (tables.length === 0) {
      console.log('❌ ita_attendance_signed table does not exist');
      
      // Check for other ITA-related tables
      const [allTables] = await connection.promise().query('SHOW TABLES LIKE "%ita%"');
      console.log('\nOther ITA-related tables:');
      console.table(allTables);
    } else {
      console.log('✅ ita_attendance_signed table exists');

      // Check table structure
      console.log('\n=== ITA_ATTENDANCE_SIGNED TABLE STRUCTURE ===');
      const [columns] = await connection.promise().query('DESCRIBE ita_attendance_signed');
      console.table(columns);

      // Check sample data
      console.log('\n=== SAMPLE ITA_ATTENDANCE_SIGNED DATA ===');
      const [records] = await connection.promise().query('SELECT * FROM ita_attendance_signed LIMIT 5');
      console.table(records);

      // Check total count
      const [countResult] = await connection.promise().query('SELECT COUNT(*) as total FROM ita_attendance_signed');
      console.log(`\nTotal records: ${countResult[0].total}`);
    }

    // Check if ita_master table exists
    console.log('\n=== CHECKING ITA_MASTER TABLE ===');
    const [masterTables] = await connection.promise().query('SHOW TABLES LIKE "ita_master"');
    
    if (masterTables.length === 0) {
      console.log('❌ ita_master table does not exist');
    } else {
      console.log('✅ ita_master table exists');
      
      // Check sample data
      const [masterRecords] = await connection.promise().query('SELECT * FROM ita_master LIMIT 3');
      console.log('\nSample ita_master records:');
      console.table(masterRecords);
    }

  } catch (error) {
    console.error('❌ Error checking ITA tables:', error.message);
  } finally {
    connection.end();
  }
}

// Run the script
checkITATables(); 