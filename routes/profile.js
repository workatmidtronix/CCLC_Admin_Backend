const express = require('express');
const router = express.Router();

// Create tables if not exists - Sequential version to avoid race conditions
const createProfileTables = (db, callback) => {
    const tables = [
      `CREATE TABLE IF NOT EXISTS academic_years (
        id INT AUTO_INCREMENT PRIMARY KEY,
        academic_year VARCHAR(20) NOT NULL UNIQUE,
        is_current_year BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_id VARCHAR(50) UNIQUE,
      department_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS semesters (
        id INT AUTO_INCREMENT PRIMARY KEY,
      semester_name VARCHAR(100) NOT NULL,
      semester_code VARCHAR(20),
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS designations (
        id INT AUTO_INCREMENT PRIMARY KEY,
      designation_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
      location_name VARCHAR(255) NOT NULL,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
    `CREATE TABLE IF NOT EXISTS workforces (
        id INT AUTO_INCREMENT PRIMARY KEY,
      workforce_name VARCHAR(255) NOT NULL,
      workforce_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS individuals (
        id INT AUTO_INCREMENT PRIMARY KEY,
      individual_name VARCHAR(255) NOT NULL,
      contact_info TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
    `CREATE TABLE IF NOT EXISTS days_preferred (
        id INT AUTO_INCREMENT PRIMARY KEY,
      day_name VARCHAR(50) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS master_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
      data_type VARCHAR(100) NOT NULL,
      data_key VARCHAR(255) NOT NULL,
        data_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_data (data_type, data_key)
      )`
    ];

  // Create tables sequentially to avoid race conditions
  const createTableSequentially = (index) => {
    if (index >= tables.length) {
      // All tables created successfully
      callback(null);
      return;
    }

    db.query(tables[index], (err) => {
        if (err) {
          console.error(`Error creating table ${index}:`, err);
        callback(err);
        return;
      }
      
      // Move to next table
      createTableSequentially(index + 1);
    });
  };

  // Start creating tables from index 0
  createTableSequentially(0);
};

// ==================== ACADEMIC YEAR ROUTES ====================

// Get all academic years
router.get('/academic-years', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    db.query('SELECT * FROM academic_years ORDER BY academic_year DESC', (err, results) => {
      if (err) {
        console.error('Error fetching academic years:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, academicYears: results });
    });
  });
});

// Add academic year
router.post('/academic-years', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const { academicYear, isCurrentYear } = req.body;
    
    // If this is set as current year, unset all others
    if (isCurrentYear) {
      db.query('UPDATE academic_years SET is_current_year = FALSE', (err) => {
        if (err) {
          console.error('Error updating academic years:', err);
          return res.status(500).json({ success: false, message: 'Database error', error: err });
    }
    
    const sql = 'INSERT INTO academic_years (academic_year, is_current_year) VALUES (?, ?)';
    db.query(sql, [academicYear, isCurrentYear], (err, result) => {
          if (err) {
            console.error('Error adding academic year:', err);
            return res.status(500).json({ success: false, message: 'Database error', error: err });
          }
      res.json({ success: true, message: 'Academic year added successfully' });
    });
      });
    } else {
      const sql = 'INSERT INTO academic_years (academic_year, is_current_year) VALUES (?, ?)';
      db.query(sql, [academicYear, isCurrentYear], (err, result) => {
        if (err) {
          console.error('Error adding academic year:', err);
          return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        res.json({ success: true, message: 'Academic year added successfully' });
      });
    }
  });
});

// Update academic year
router.put('/academic-years/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    const { academicYear, isCurrentYear } = req.body;
    
    // If this is set as current year, unset all others
    if (isCurrentYear) {
      db.query('UPDATE academic_years SET is_current_year = FALSE WHERE id != ?', [id], (err) => {
        if (err) {
          console.error('Error updating academic years:', err);
          return res.status(500).json({ success: false, message: 'Database error', error: err });
    }
    
    const sql = 'UPDATE academic_years SET academic_year = ?, is_current_year = ? WHERE id = ?';
    db.query(sql, [academicYear, isCurrentYear, id], (err, result) => {
          if (err) {
            console.error('Error updating academic year:', err);
            return res.status(500).json({ success: false, message: 'Database error', error: err });
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Academic year not found' });
          }
      res.json({ success: true, message: 'Academic year updated successfully' });
    });
      });
    } else {
      const sql = 'UPDATE academic_years SET academic_year = ?, is_current_year = ? WHERE id = ?';
      db.query(sql, [academicYear, isCurrentYear, id], (err, result) => {
        if (err) {
          console.error('Error updating academic year:', err);
          return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Academic year not found' });
        }
        res.json({ success: true, message: 'Academic year updated successfully' });
      });
    }
  });
});

// Delete academic year
router.delete('/academic-years/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    db.query('DELETE FROM academic_years WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Error deleting academic year:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Academic year not found' });
      }
      res.json({ success: true, message: 'Academic year deleted successfully' });
    });
  });
});

// ==================== DEPARTMENTS ROUTES ====================

// Get all departments
router.get('/departments', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    db.query('SELECT * FROM departments ORDER BY department_name', (err, results) => {
      if (err) {
        console.error('Error fetching departments:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, departments: results });
    });
  });
});

// Add department
router.post('/departments', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const { departmentName } = req.body;
    const departmentId = 'DEPT' + Date.now(); // Generate unique ID
    
    const sql = 'INSERT INTO departments (department_id, department_name) VALUES (?, ?)';
    db.query(sql, [departmentId, departmentName], (err, result) => {
      if (err) {
        console.error('Error adding department:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, message: 'Department added successfully' });
    });
  });
});

// Update department
router.put('/departments/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    const { departmentName } = req.body;
    
    const sql = 'UPDATE departments SET department_name = ? WHERE id = ?';
    db.query(sql, [departmentName, id], (err, result) => {
      if (err) {
        console.error('Error updating department:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      res.json({ success: true, message: 'Department updated successfully' });
    });
  });
});

// Delete department
router.delete('/departments/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    db.query('DELETE FROM departments WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Error deleting department:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      res.json({ success: true, message: 'Department deleted successfully' });
    });
  });
});

// ==================== SEMESTERS ROUTES ====================

// Get all semesters
router.get('/semesters', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    db.query('SELECT * FROM semesters ORDER BY semester_name', (err, results) => {
      if (err) {
        console.error('Error fetching semesters:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, semesters: results });
    });
  });
});

// Add semester
router.post('/semesters', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const { semesterName, semesterCode, startDate, endDate } = req.body;
    const sql = 'INSERT INTO semesters (semester_name, semester_code, start_date, end_date) VALUES (?, ?, ?, ?)';
    db.query(sql, [semesterName, semesterCode, startDate, endDate], (err, result) => {
      if (err) {
        console.error('Error adding semester:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, message: 'Semester added successfully' });
    });
  });
});

// Update semester
router.put('/semesters/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    const { semesterName, semesterCode, startDate, endDate } = req.body;
    
    const sql = 'UPDATE semesters SET semester_name = ?, semester_code = ?, start_date = ?, end_date = ? WHERE id = ?';
    db.query(sql, [semesterName, semesterCode, startDate, endDate, id], (err, result) => {
      if (err) {
        console.error('Error updating semester:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Semester not found' });
      }
      res.json({ success: true, message: 'Semester updated successfully' });
    });
  });
});

// Delete semester
router.delete('/semesters/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    db.query('DELETE FROM semesters WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Error deleting semester:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Semester not found' });
      }
      res.json({ success: true, message: 'Semester deleted successfully' });
    });
  });
});

// ==================== DESIGNATIONS ROUTES ====================

// Get all designations
router.get('/designations', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    db.query('SELECT * FROM designations ORDER BY designation_name', (err, results) => {
      if (err) {
        console.error('Error fetching designations:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, designations: results });
    });
  });
});

// Add designation
router.post('/designations', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const { designationName, designationCode, description } = req.body;
    
    const sql = 'INSERT INTO designations (designation_name, designation_code, description) VALUES (?, ?, ?)';
    db.query(sql, [designationName, designationCode, description], (err, result) => {
      if (err) {
        console.error('Error adding designation:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, message: 'Designation added successfully' });
    });
  });
});

// Update designation
router.put('/designations/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    const { designationName, designationCode, description } = req.body;
    
    const sql = 'UPDATE designations SET designation_name = ?, designation_code = ?, description = ? WHERE id = ?';
    db.query(sql, [designationName, designationCode, description, id], (err, result) => {
      if (err) {
        console.error('Error updating designation:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Designation not found' });
      }
      res.json({ success: true, message: 'Designation updated successfully' });
    });
  });
});

// Delete designation
router.delete('/designations/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    db.query('DELETE FROM designations WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Error deleting designation:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Designation not found' });
      }
      res.json({ success: true, message: 'Designation deleted successfully' });
    });
  });
});

// ==================== LOCATIONS ROUTES ====================

// Get all locations
router.get('/locations', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    db.query('SELECT * FROM locations ORDER BY location_name', (err, results) => {
      if (err) {
        console.error('Error fetching locations:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, locations: results });
    });
  });
});

// Add location
router.post('/locations', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const { locationName, address, city, state, postalCode, country, phone, email } = req.body;
    
    const sql = 'INSERT INTO locations (location_name, address, city, state, postal_code, country, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [locationName, address, city, state, postalCode, country, phone, email], (err, result) => {
      if (err) {
        console.error('Error adding location:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, message: 'Location added successfully' });
    });
  });
});

// Update location
router.put('/locations/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    const { locationName, address, city, state, postalCode, country, phone, email } = req.body;
    
    const sql = 'UPDATE locations SET location_name = ?, address = ?, city = ?, state = ?, postal_code = ?, country = ?, phone = ?, email = ? WHERE id = ?';
    db.query(sql, [locationName, address, city, state, postalCode, country, phone, email, id], (err, result) => {
      if (err) {
        console.error('Error updating location:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Location not found' });
      }
      res.json({ success: true, message: 'Location updated successfully' });
    });
  });
});

// Delete location
router.delete('/locations/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    db.query('DELETE FROM locations WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Error deleting location:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Location not found' });
      }
      res.json({ success: true, message: 'Location deleted successfully' });
    });
  });
});

// ==================== DAYS PREFERRED ROUTES ====================

// Get all days preferred
router.get('/days-preferred', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    db.query('SELECT * FROM days_preferred ORDER BY day_name', (err, results) => {
      if (err) {
        console.error('Error fetching days preferred:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, daysPreferred: results });
    });
  });
});

// Add day preferred
router.post('/days-preferred', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const { dayName, dayCode, isActive } = req.body;
    
    const sql = 'INSERT INTO days_preferred (day_name, day_code, is_active) VALUES (?, ?, ?)';
    db.query(sql, [dayName, dayCode, isActive], (err, result) => {
      if (err) {
        console.error('Error adding day preferred:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, message: 'Day preferred added successfully' });
    });
  });
});

// Update day preferred
router.put('/days-preferred/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    const { dayName, dayCode, isActive } = req.body;
    
    const sql = 'UPDATE days_preferred SET day_name = ?, day_code = ?, is_active = ? WHERE id = ?';
    db.query(sql, [dayName, dayCode, isActive, id], (err, result) => {
      if (err) {
        console.error('Error updating day preferred:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Day preferred not found' });
      }
      res.json({ success: true, message: 'Day preferred updated successfully' });
    });
  });
});

// Delete day preferred
router.delete('/days-preferred/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    db.query('DELETE FROM days_preferred WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Error deleting day preferred:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Day preferred not found' });
      }
      res.json({ success: true, message: 'Day preferred deleted successfully' });
    });
  });
});

// ==================== INDIVIDUALS ROUTES ====================

// Get all individuals
router.get('/individuals', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    db.query('SELECT * FROM individuals ORDER BY first_name, last_name', (err, results) => {
      if (err) {
        console.error('Error fetching individuals:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, individuals: results });
    });
  });
});

// Add individual
router.post('/individuals', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const { firstName, lastName, email, phone, designation, department } = req.body;
    console.log(req.body);
    const sql = 'INSERT INTO individuals (first_name, last_name, email, phone, designation, department) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [firstName, lastName, email, phone, designation, department], (err, result) => {
      if (err) {
        console.error('Error adding individual:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, message: 'Individual added successfully' });
    });
  });
});

// Update individual
router.put('/individuals/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    const { firstName, lastName, email, phone, designation, department } = req.body;
    
    const sql = 'UPDATE individuals SET first_name = ?, last_name = ?, email = ?, phone = ?, designation = ?, department = ? WHERE id = ?';
    db.query(sql, [firstName, lastName, email, phone, designation, department, id], (err, result) => {
      if (err) {
        console.error('Error updating individual:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Individual not found' });
      }
      res.json({ success: true, message: 'Individual updated successfully' });
    });
  });
});

// Delete individual
router.delete('/individuals/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    db.query('DELETE FROM individuals WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Error deleting individual:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Individual not found' });
      }
      res.json({ success: true, message: 'Individual deleted successfully' });
    });
  });
});

// ==================== WORKFORCES ROUTES ====================

// Get all workforces
router.get('/workforces', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    db.query('SELECT * FROM workforces ORDER BY workforce_name', (err, results) => {
      if (err) {
        console.error('Error fetching workforces:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, workforces: results });
    });
  });
});

// Add workforce
router.post('/workforces', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const { workforceName, workforceType, description } = req.body;
    
    const sql = 'INSERT INTO workforces (workforce_name, workforce_type, description) VALUES (?, ?, ?)';
    db.query(sql, [workforceName, workforceType, description], (err, result) => {
      if (err) {
        console.error('Error adding workforce:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, message: 'Workforce added successfully' });
    });
  });
});

// Update workforce
router.put('/workforces/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    const { workforceName, workforceType, description } = req.body;
    
    const sql = 'UPDATE workforces SET workforce_name = ?, workforce_type = ?, description = ? WHERE id = ?';
    db.query(sql, [workforceName, workforceType, description, id], (err, result) => {
      if (err) {
        console.error('Error updating workforce:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Workforce not found' });
      }
      res.json({ success: true, message: 'Workforce updated successfully' });
    });
  });
});

// Delete workforce
router.delete('/workforces/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    db.query('DELETE FROM workforces WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Error deleting workforce:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Workforce not found' });
      }
      res.json({ success: true, message: 'Workforce deleted successfully' });
    });
  });
});

// ==================== MASTER DATA ROUTES ====================

// Get all master data
router.get('/master-data', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    db.query('SELECT * FROM master_data ORDER BY data_type, data_key', (err, results) => {
      if (err) {
        console.error('Error fetching master data:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, masterData: results });
    });
  });
});

// Add master data
router.post('/master-data', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const { dataType, dataKey, dataValue, description } = req.body;
    
    const sql = 'INSERT INTO master_data (data_type, data_key, data_value, description) VALUES (?, ?, ?, ?)';
    db.query(sql, [dataType, dataKey, dataValue, description], (err, result) => {
      if (err) {
        console.error('Error adding master data:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, message: 'Master data added successfully' });
    });
  });
});

// Update master data
router.put('/master-data/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    const { dataType, dataKey, dataValue, description } = req.body;
    
    const sql = 'UPDATE master_data SET data_type = ?, data_key = ?, data_value = ?, description = ? WHERE id = ?';
    db.query(sql, [dataType, dataKey, dataValue, description, id], (err, result) => {
      if (err) {
        console.error('Error updating master data:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Master data not found' });
      }
      res.json({ success: true, message: 'Master data updated successfully' });
    });
  });
});

// Delete master data
router.delete('/master-data/:id', (req, res) => {
    const db = req.app.locals.db;
  
  createProfileTables(db, (err) => {
    if (err) {
      console.error('Error creating profile tables:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    db.query('DELETE FROM master_data WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Error deleting master data:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Master data not found' });
      }
      res.json({ success: true, message: 'Master data deleted successfully' });
    });
  });
});

module.exports = router; 