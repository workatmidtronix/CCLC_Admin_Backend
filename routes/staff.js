const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Multer storage for staff photo
const staffStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const email = req.body.email;
    if (!email) return cb(new Error('Email is required for file upload'), null);
    const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
    const dir = path.join('uploads', 'staff', safeEmail);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, 'profileImage' + path.extname(file.originalname));
  }
});
const upload = multer({ storage: staffStorage });

// Create staff table if not exists
const createStaffTable = (db) => {
  return new Promise((resolve, reject) => {
    const sql = `CREATE TABLE IF NOT EXISTS staff (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      salutation VARCHAR(50),
      contact_number VARCHAR(50),
      email VARCHAR(255),
      qualification VARCHAR(255),
      date_of_birth DATE,
      gender VARCHAR(20),
      marital_status VARCHAR(20),
      photo VARCHAR(255),
      status VARCHAR(50),
      address_line1 VARCHAR(255),
      address_line2 VARCHAR(255),
      city VARCHAR(100),
      state VARCHAR(100),
      postal_code VARCHAR(20),
      country VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    db.query(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

// Add Staff Member
router.post('/add', upload.single('photo'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createStaffTable(db);
    const {
      name, salutation, contact_number, email, qualification, date_of_birth, gender, marital_status, status, address_line1, address_line2, city, state, postal_code, country
    } = req.body;
    const photo = req.file ? `/uploads/staff/${email.replace(/[^a-zA-Z0-9]/g, '_')}/${req.file.filename}` : null;
    const sql = `INSERT INTO staff (name, salutation, contact_number, email, qualification, date_of_birth, gender, marital_status, photo, status, address_line1, address_line2, city, state, postal_code, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [name, salutation, contact_number, email, qualification, date_of_birth, gender, marital_status, photo, status, address_line1, address_line2, city, state, postal_code, country];
    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, message: 'Staff member added successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Get all staff members
router.get('/all', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createStaffTable(db);
    db.query('SELECT * FROM staff ORDER BY created_at DESC', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, staff: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Get all instructors (from instructors table)
router.get('/instructors', async (req, res) => {
  try {
    const db = req.app.locals.db;
    // Create instructors table if not exists (reuse the function from instructors route)
    const createInstructorsTable = (db) => {
      return new Promise((resolve, reject) => {
        const sql = `CREATE TABLE IF NOT EXISTS instructors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          instructor_id VARCHAR(255),
          name VARCHAR(255) NOT NULL,
          salutation VARCHAR(50),
          contact_number VARCHAR(50),
          email VARCHAR(255),
          qualification VARCHAR(255),
          course VARCHAR(255),
          date_of_birth DATE,
          gender VARCHAR(20),
          marital_status VARCHAR(20),
          photo VARCHAR(255),
          department VARCHAR(255),
          designation VARCHAR(255),
          status VARCHAR(50),
          address_line1 VARCHAR(255),
          address_line2 VARCHAR(255),
          city VARCHAR(100),
          state VARCHAR(100),
          postal_code VARCHAR(20),
          country VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        db.query(sql, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    };
    
    await createInstructorsTable(db);
    db.query('SELECT * FROM instructors ORDER BY created_at DESC', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, instructors: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Edit Staff Member
router.post('/edit/:id', upload.single('photo'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createStaffTable(db);
    const id = req.params.id;
    const {
      name, salutation, contact_number, email, qualification, date_of_birth, gender, marital_status, status, address_line1, address_line2, city, state, postal_code, country
    } = req.body;
    let photo = null;
    if (req.file) {
      photo = `/uploads/staff/${email.replace(/[^a-zA-Z0-9]/g, '_')}/${req.file.filename}`;
    }
    let sql = `UPDATE staff SET name=?, salutation=?, contact_number=?, email=?, qualification=?, date_of_birth=?, gender=?, marital_status=?, status=?, address_line1=?, address_line2=?, city=?, state=?, postal_code=?, country=?`;
    const values = [name, salutation, contact_number, email, qualification, date_of_birth, gender, marital_status, status, address_line1, address_line2, city, state, postal_code, country];
    if (photo) {
      sql += ', photo=?';
      values.push(photo);
    }
    sql += ' WHERE id=?';
    values.push(id);
    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Staff member not found' });
      res.json({ success: true, message: 'Staff member updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Delete Staff Member
router.delete('/delete/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createStaffTable(db);
    const id = req.params.id;
    db.query('DELETE FROM staff WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Staff member not found' });
      res.json({ success: true, message: 'Staff member deleted successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Edit Instructor
router.post('/edit-instructor/:id', upload.single('photo'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    // Create instructors table if not exists (reuse the function from instructors route)
    const createInstructorsTable = (db) => {
      return new Promise((resolve, reject) => {
        const sql = `CREATE TABLE IF NOT EXISTS instructors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          instructor_id VARCHAR(255),
          name VARCHAR(255) NOT NULL,
          salutation VARCHAR(50),
          contact_number VARCHAR(50),
          email VARCHAR(255),
          qualification VARCHAR(255),
          course VARCHAR(255),
          date_of_birth DATE,
          gender VARCHAR(20),
          marital_status VARCHAR(20),
          photo VARCHAR(255),
          department VARCHAR(255),
          designation VARCHAR(255),
          status VARCHAR(50),
          address_line1 VARCHAR(255),
          address_line2 VARCHAR(255),
          city VARCHAR(100),
          state VARCHAR(100),
          postal_code VARCHAR(20),
          country VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        db.query(sql, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    };
    
    await createInstructorsTable(db);
    const id = req.params.id;
    const {
      instructor_id, name, salutation, contact_number, email, qualification, course, date_of_birth, gender, marital_status, department, designation, status, address_line1, address_line2, city, state, postal_code, country
    } = req.body;
    let photo = null;
    if (req.file) {
      photo = `/uploads/instructor/${email.replace(/[^a-zA-Z0-9]/g, '_')}/${req.file.filename}`;
    }
    let sql = `UPDATE instructors SET instructor_id=?, name=?, salutation=?, contact_number=?, email=?, qualification=?, course=?, date_of_birth=?, gender=?, marital_status=?, department=?, designation=?, status=?, address_line1=?, address_line2=?, city=?, state=?, postal_code=?, country=?`;
    const values = [instructor_id, name, salutation, contact_number, email, qualification, course, date_of_birth, gender, marital_status, department, designation, status, address_line1, address_line2, city, state, postal_code, country];
    if (photo) {
      sql += ', photo=?';
      values.push(photo);
    }
    sql += ' WHERE id=?';
    values.push(id);
    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Instructor not found' });
      res.json({ success: true, message: 'Instructor updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Delete Instructor
router.delete('/delete-instructor/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    // Create instructors table if not exists (reuse the function from instructors route)
    const createInstructorsTable = (db) => {
      return new Promise((resolve, reject) => {
        const sql = `CREATE TABLE IF NOT EXISTS instructors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          instructor_id VARCHAR(255),
          name VARCHAR(255) NOT NULL,
          salutation VARCHAR(50),
          contact_number VARCHAR(50),
          email VARCHAR(255),
          qualification VARCHAR(255),
          course VARCHAR(255),
          date_of_birth DATE,
          gender VARCHAR(20),
          marital_status VARCHAR(20),
          photo VARCHAR(255),
          department VARCHAR(255),
          designation VARCHAR(255),
          status VARCHAR(50),
          address_line1 VARCHAR(255),
          address_line2 VARCHAR(255),
          city VARCHAR(100),
          state VARCHAR(100),
          postal_code VARCHAR(20),
          country VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        db.query(sql, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    };
    
    await createInstructorsTable(db);
    const id = req.params.id;
    db.query('DELETE FROM instructors WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Instructor not found' });
      res.json({ success: true, message: 'Instructor deleted successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

module.exports = router; 