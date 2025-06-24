const express = require('express');
const router = express.Router();

// Create tables if not exists
const createProfileTables = (db) => {
  return new Promise((resolve, reject) => {
    const tables = [
      // Academic Year table
      `CREATE TABLE IF NOT EXISTS academic_years (
        id INT AUTO_INCREMENT PRIMARY KEY,
        academic_year VARCHAR(20) NOT NULL UNIQUE,
        is_current_year BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      // Departments table
      `CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_id VARCHAR(50) UNIQUE,
        department_name VARCHAR(100) NOT NULL,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      // Semesters table
      `CREATE TABLE IF NOT EXISTS semesters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        semester_name VARCHAR(50) NOT NULL,
        semester_code VARCHAR(20) UNIQUE,
        start_date DATE,
        end_date DATE,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      // Designations table
      `CREATE TABLE IF NOT EXISTS designations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        designation_name VARCHAR(100) NOT NULL,
        designation_code VARCHAR(20) UNIQUE,
        description TEXT,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      // Locations table
      `CREATE TABLE IF NOT EXISTS locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        location_name VARCHAR(100) NOT NULL,
        address TEXT,
        city VARCHAR(50),
        state VARCHAR(50),
        postal_code VARCHAR(20),
        country VARCHAR(50),
        phone VARCHAR(20),
        email VARCHAR(100),
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      // Days Preferred table
      `CREATE TABLE IF NOT EXISTS days_preferred (
        id INT AUTO_INCREMENT PRIMARY KEY,
        day_name VARCHAR(20) NOT NULL UNIQUE,
        day_code VARCHAR(10) UNIQUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      // Individuals table
      `CREATE TABLE IF NOT EXISTS individuals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        designation VARCHAR(100),
        department VARCHAR(100),
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      // Workforces table
      `CREATE TABLE IF NOT EXISTS workforces (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workforce_name VARCHAR(100) NOT NULL,
        workforce_type VARCHAR(50),
        description TEXT,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      // Master Data table
      `CREATE TABLE IF NOT EXISTS master_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        data_type VARCHAR(50) NOT NULL,
        data_key VARCHAR(100) NOT NULL,
        data_value TEXT,
        description TEXT,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_data (data_type, data_key)
      )`
    ];

    let completed = 0;
    tables.forEach((sql, index) => {
      db.query(sql, (err) => {
        if (err) {
          console.error(`Error creating table ${index}:`, err);
          return reject(err);
        }
        completed++;
        if (completed === tables.length) {
          resolve();
        }
      });
    });
  });
};

// ==================== ACADEMIC YEAR ROUTES ====================

// Get all academic years
router.get('/academic-years', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    db.query('SELECT * FROM academic_years ORDER BY academic_year DESC', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, academicYears: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Add academic year
router.post('/academic-years', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const { academicYear, isCurrentYear } = req.body;
    
    // If this is set as current year, unset all others
    if (isCurrentYear) {
      db.query('UPDATE academic_years SET is_current_year = FALSE');
    }
    
    const sql = 'INSERT INTO academic_years (academic_year, is_current_year) VALUES (?, ?)';
    db.query(sql, [academicYear, isCurrentYear], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, message: 'Academic year added successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Update academic year
router.put('/academic-years/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    const { academicYear, isCurrentYear } = req.body;
    
    // If this is set as current year, unset all others
    if (isCurrentYear) {
      db.query('UPDATE academic_years SET is_current_year = FALSE WHERE id != ?', [id]);
    }
    
    const sql = 'UPDATE academic_years SET academic_year = ?, is_current_year = ? WHERE id = ?';
    db.query(sql, [academicYear, isCurrentYear, id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Academic year not found' });
      res.json({ success: true, message: 'Academic year updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Delete academic year
router.delete('/academic-years/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    db.query('DELETE FROM academic_years WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Academic year not found' });
      res.json({ success: true, message: 'Academic year deleted successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// ==================== DEPARTMENTS ROUTES ====================

// Get all departments
router.get('/departments', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    db.query('SELECT * FROM departments ORDER BY department_name', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, departments: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Add department
router.post('/departments', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const { departmentName } = req.body;
    const departmentId = 'DEPT' + Date.now(); // Generate unique ID
    
    const sql = 'INSERT INTO departments (department_id, department_name) VALUES (?, ?)';
    db.query(sql, [departmentId, departmentName], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, message: 'Department added successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Update department
router.put('/departments/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    const { departmentName } = req.body;
    
    const sql = 'UPDATE departments SET department_name = ? WHERE id = ?';
    db.query(sql, [departmentName, id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Department not found' });
      res.json({ success: true, message: 'Department updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Delete department
router.delete('/departments/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    db.query('DELETE FROM departments WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Department not found' });
      res.json({ success: true, message: 'Department deleted successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// ==================== SEMESTERS ROUTES ====================

// Get all semesters
router.get('/semesters', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    db.query('SELECT * FROM semesters ORDER BY semester_name', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, semesters: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Add semester
router.post('/semesters', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const { semesterName, semesterCode, startDate, endDate } = req.body;
    const sql = 'INSERT INTO semesters (semester_name, semester_code, start_date, end_date) VALUES (?, ?, ?, ?)';
    db.query(sql, [semesterName, semesterCode, startDate, endDate], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, message: 'Semester added successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Update semester
router.put('/semesters/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    const { semesterName, semesterCode, startDate, endDate } = req.body;
    
    const sql = 'UPDATE semesters SET semester_name = ?, semester_code = ?, start_date = ?, end_date = ? WHERE id = ?';
    db.query(sql, [semesterName, semesterCode, startDate, endDate, id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Semester not found' });
      res.json({ success: true, message: 'Semester updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Delete semester
router.delete('/semesters/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    db.query('DELETE FROM semesters WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Semester not found' });
      res.json({ success: true, message: 'Semester deleted successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// ==================== DESIGNATIONS ROUTES ====================

// Get all designations
router.get('/designations', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    db.query('SELECT * FROM designations ORDER BY designation_name', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, designations: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Add designation
router.post('/designations', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const { designationName, designationCode, description } = req.body;
    
    const sql = 'INSERT INTO designations (designation_name, designation_code, description) VALUES (?, ?, ?)';
    db.query(sql, [designationName, designationCode, description], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, message: 'Designation added successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Update designation
router.put('/designations/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    const { designationName, designationCode, description } = req.body;
    
    const sql = 'UPDATE designations SET designation_name = ?, designation_code = ?, description = ? WHERE id = ?';
    db.query(sql, [designationName, designationCode, description, id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Designation not found' });
      res.json({ success: true, message: 'Designation updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Delete designation
router.delete('/designations/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    db.query('DELETE FROM designations WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Designation not found' });
      res.json({ success: true, message: 'Designation deleted successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// ==================== LOCATIONS ROUTES ====================

// Get all locations
router.get('/locations', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    db.query('SELECT * FROM locations ORDER BY location_name', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, locations: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Add location
router.post('/locations', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const { locationName, address, city, state, postalCode, country, phone, email } = req.body;
    
    const sql = 'INSERT INTO locations (location_name, address, city, state, postal_code, country, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [locationName, address, city, state, postalCode, country, phone, email], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, message: 'Location added successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Update location
router.put('/locations/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    const { locationName, address, city, state, postalCode, country, phone, email } = req.body;
    
    const sql = 'UPDATE locations SET location_name = ?, address = ?, city = ?, state = ?, postal_code = ?, country = ?, phone = ?, email = ? WHERE id = ?';
    db.query(sql, [locationName, address, city, state, postalCode, country, phone, email, id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Location not found' });
      res.json({ success: true, message: 'Location updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Delete location
router.delete('/locations/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    db.query('DELETE FROM locations WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Location not found' });
      res.json({ success: true, message: 'Location deleted successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// ==================== DAYS PREFERRED ROUTES ====================

// Get all days preferred
router.get('/days-preferred', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    db.query('SELECT * FROM days_preferred ORDER BY day_name', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, daysPreferred: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Add day preferred
router.post('/days-preferred', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const { dayName, dayCode, isActive } = req.body;
    
    const sql = 'INSERT INTO days_preferred (day_name, day_code, is_active) VALUES (?, ?, ?)';
    db.query(sql, [dayName, dayCode, isActive], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, message: 'Day preferred added successfully' });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Update day preferred
router.put('/days-preferred/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    const { dayName, dayCode, isActive } = req.body;
    
    const sql = 'UPDATE days_preferred SET day_name = ?, day_code = ?, is_active = ? WHERE id = ?';
    db.query(sql, [dayName, dayCode, isActive, id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Day preferred not found' });
      res.json({ success: true, message: 'Day preferred updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Delete day preferred
router.delete('/days-preferred/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    db.query('DELETE FROM days_preferred WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Day preferred not found' });
      res.json({ success: true, message: 'Day preferred deleted successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// ==================== INDIVIDUALS ROUTES ====================

// Get all individuals
router.get('/individuals', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    db.query('SELECT * FROM individuals ORDER BY first_name, last_name', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, individuals: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Add individual
router.post('/individuals', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const { firstName, lastName, email, phone, designation, department } = req.body;
    console.log(req.body);
    const sql = 'INSERT INTO individuals (first_name, last_name, email, phone, designation, department) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [firstName, lastName, email, phone, designation, department], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, message: 'Individual added successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Update individual
router.put('/individuals/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    const { firstName, lastName, email, phone, designation, department } = req.body;
    
    const sql = 'UPDATE individuals SET first_name = ?, last_name = ?, email = ?, phone = ?, designation = ?, department = ? WHERE id = ?';
    db.query(sql, [firstName, lastName, email, phone, designation, department, id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Individual not found' });
      res.json({ success: true, message: 'Individual updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Delete individual
router.delete('/individuals/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    db.query('DELETE FROM individuals WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Individual not found' });
      res.json({ success: true, message: 'Individual deleted successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// ==================== WORKFORCES ROUTES ====================

// Get all workforces
router.get('/workforces', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    db.query('SELECT * FROM workforces ORDER BY workforce_name', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, workforces: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Add workforce
router.post('/workforces', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const { workforceName, workforceType, description } = req.body;
    
    const sql = 'INSERT INTO workforces (workforce_name, workforce_type, description) VALUES (?, ?, ?)';
    db.query(sql, [workforceName, workforceType, description], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, message: 'Workforce added successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Update workforce
router.put('/workforces/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    const { workforceName, workforceType, description } = req.body;
    
    const sql = 'UPDATE workforces SET workforce_name = ?, workforce_type = ?, description = ? WHERE id = ?';
    db.query(sql, [workforceName, workforceType, description, id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Workforce not found' });
      res.json({ success: true, message: 'Workforce updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Delete workforce
router.delete('/workforces/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    db.query('DELETE FROM workforces WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Workforce not found' });
      res.json({ success: true, message: 'Workforce deleted successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// ==================== MASTER DATA ROUTES ====================

// Get all master data
router.get('/master-data', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    db.query('SELECT * FROM master_data ORDER BY data_type, data_key', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, masterData: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Add master data
router.post('/master-data', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const { dataType, dataKey, dataValue, description } = req.body;
    
    const sql = 'INSERT INTO master_data (data_type, data_key, data_value, description) VALUES (?, ?, ?, ?)';
    db.query(sql, [dataType, dataKey, dataValue, description], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, message: 'Master data added successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Update master data
router.put('/master-data/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    const { dataType, dataKey, dataValue, description } = req.body;
    
    const sql = 'UPDATE master_data SET data_type = ?, data_key = ?, data_value = ?, description = ? WHERE id = ?';
    db.query(sql, [dataType, dataKey, dataValue, description, id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Master data not found' });
      res.json({ success: true, message: 'Master data updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Delete master data
router.delete('/master-data/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createProfileTables(db);
    const id = req.params.id;
    db.query('DELETE FROM master_data WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Master data not found' });
      res.json({ success: true, message: 'Master data deleted successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

module.exports = router; 