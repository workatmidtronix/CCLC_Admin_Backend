const express = require('express');
const router = express.Router();
const { handleSingleFileUpload, getRelativePath } = require('../utils/fileUpload');

// Create instructors table if not exists
const createInstructorsTable = (db, callback) => {
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
  
  db.query(sql, callback);
};

// @route   GET /api/instructors
// @desc    Get all instructors
// @access  Private
router.get('/', (req, res) => {
    const db = req.app.locals.db;
  
  createInstructorsTable(db, (err) => {
    if (err) {
      console.error('Error creating instructors table:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const query = `
      SELECT 
        id,
        instructor_id,
        name,
        salutation,
        contact_number,
        email,
        qualification,
        course,
        date_of_birth,
        gender,
        marital_status,
        photo,
        department,
        designation,
        status,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        created_at
      FROM instructors 
      ORDER BY created_at DESC
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching instructors:', err);
        return res.status(500).json({ success: false, message: 'Database error while fetching instructors' });
      }
      res.json({ success: true, instructors: results });
    });
  });
});

// Add Instructor
router.post('/add', handleSingleFileUpload('instructor', 'photo'), (req, res) => {
    const db = req.app.locals.db;
  
  createInstructorsTable(db, (err) => {
    if (err) {
      console.error('Error creating instructors table:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const {
      instructor_id, name, salutation, contact_number, email, qualification, course, date_of_birth, gender, marital_status, department, designation, status, address_line1, address_line2, city, state, postal_code, country
    } = req.body;
    
    const photo = req.file ? getRelativePath('instructor', email, req.file.filename) : null;
    
    const sql = `INSERT INTO instructors (instructor_id, name, salutation, contact_number, email, qualification, course, date_of_birth, gender, marital_status, photo, department, designation, status, address_line1, address_line2, city, state, postal_code, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [instructor_id, name, salutation, contact_number, email, qualification, course, date_of_birth, gender, marital_status, photo, department, designation, status, address_line1, address_line2, city, state, postal_code, country];
    
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error adding instructor:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err.message });
      }
      res.json({ success: true, message: 'Instructor added successfully' });
    });
  });
});

// Edit Instructor
router.post('/edit/:id', handleSingleFileUpload('instructor', 'photo'), (req, res) => {
    const db = req.app.locals.db;
  
  createInstructorsTable(db, (err) => {
    if (err) {
      console.error('Error creating instructors table:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    const id = req.params.id;
    const {
      instructor_id, name, salutation, contact_number, email, qualification, course, date_of_birth, gender, marital_status, department, designation, status, address_line1, address_line2, city, state, postal_code, country
    } = req.body;
    
    let photo = null;
    if (req.file) {
      photo = getRelativePath('instructor', email, req.file.filename);
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
      if (err) {
        console.error('Error updating instructor:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Instructor not found' });
      }
      res.json({ success: true, message: 'Instructor updated successfully' });
    });
  });
});

// Get all instructors
router.get('/all', (req, res) => {
    const db = req.app.locals.db;
  
  createInstructorsTable(db, (err) => {
    if (err) {
      console.error('Error creating instructors table:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    db.query('SELECT * FROM instructors ORDER BY created_at DESC', (err, results) => {
      if (err) {
        console.error('Error fetching all instructors:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err.message });
      }
      res.json({ success: true, instructors: results });
    });
  });
});

module.exports = router; 