const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// @route   GET /api/instructors
// @desc    Get all instructors
// @access  Private
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createInstructorsTable(db);
    
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
  } catch (error) {
    console.error('Server error in GET /instructors:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching instructors' });
  }
});

// Multer storage for instructor photo
const instructorStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const email = req.body.email;
    if (!email) return cb(new Error('Email is required for file upload'), null);
    const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
    const dir = path.join('uploads', 'instructor', safeEmail);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, 'profileImage' + path.extname(file.originalname));
  }
});
const upload = multer({ storage: instructorStorage });

// Create instructors table if not exists
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

// Add Instructor
router.post('/add', upload.single('photo'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createInstructorsTable(db);
    const {
      instructor_id, name, salutation, contact_number, email, qualification, course, date_of_birth, gender, marital_status, department, designation, status, address_line1, address_line2, city, state, postal_code, country
    } = req.body;
    const photo = req.file ? `/uploads/instructor/${email.replace(/[^a-zA-Z0-9]/g, '_')}/${req.file.filename}` : null;
    const sql = `INSERT INTO instructors (instructor_id, name, salutation, contact_number, email, qualification, course, date_of_birth, gender, marital_status, photo, department, designation, status, address_line1, address_line2, city, state, postal_code, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [instructor_id, name, salutation, contact_number, email, qualification, course, date_of_birth, gender, marital_status, photo, department, designation, status, address_line1, address_line2, city, state, postal_code, country];
    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, message: 'Instructor added successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Edit Instructor
router.post('/edit/:id', upload.single('photo'), async (req, res) => {
  try {
    const db = req.app.locals.db;
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

// Get all instructors
router.get('/all', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createInstructorsTable(db);
    db.query('SELECT * FROM instructors ORDER BY created_at DESC', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
      res.json({ success: true, instructors: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

module.exports = router; 