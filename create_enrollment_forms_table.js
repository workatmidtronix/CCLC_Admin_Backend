const { pool } = require('./utils/database');

async function createEnrollmentFormsTable() {
  let connection;
  
  try {
    console.log('Creating enrollment_forms table...');
    
    // Get a connection
    connection = await pool.promise().getConnection();
    console.log('Database connection established');
    
    // Create the enrollment_forms table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS enrollment_forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        form_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `;
    
    await connection.query(createTableSQL);
    console.log('✓ enrollment_forms table created successfully');
    
    // Add indexes for better performance
    const indexSQL1 = `CREATE INDEX IF NOT EXISTS idx_enrollment_forms_student_id ON enrollment_forms(student_id)`;
    const indexSQL2 = `CREATE INDEX IF NOT EXISTS idx_enrollment_forms_created_at ON enrollment_forms(created_at)`;
    
    try {
      await connection.query(indexSQL1);
      console.log('✓ Index on student_id created');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠ Index on student_id already exists');
      } else {
        console.error('Error creating student_id index:', error.message);
      }
    }
    
    try {
      await connection.query(indexSQL2);
      console.log('✓ Index on created_at created');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠ Index on created_at already exists');
      } else {
        console.error('Error creating created_at index:', error.message);
      }
    }
    
    console.log('\n🎉 enrollment_forms table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating enrollment_forms table:', error);
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
  createEnrollmentFormsTable();
}

module.exports = { createEnrollmentFormsTable }; 