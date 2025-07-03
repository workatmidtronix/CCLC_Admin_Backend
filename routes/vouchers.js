const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const { handleVoucherFileUpload, getRelativePath, getAbsolutePath } = require('../utils/fileUpload');

// Function to create the 'students_vouchers' table if it doesn't exist
const createStudentsVouchersTable = (db) => {
  return new Promise((resolve, reject) => {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS students_vouchers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        referring_wia_provider VARCHAR(255),
        case_manager_name VARCHAR(255),
        case_manager_telephone VARCHAR(20),
        training_provider VARCHAR(255),
        instructor_name VARCHAR(255),
        program_name VARCHAR(255),
        training_period_start_date DATE,
        training_period_end_date DATE,
        voucher_file_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        INDEX idx_student_id (student_id)
      );
    `;
    db.query(createTableSql, (err) => {
      if (err) {
        console.error("Error creating students_vouchers table:", err);
        return reject(new Error("Failed to create students_vouchers table."));
      }
      resolve();
    });
  });
};

// Validation middleware
const validateVoucher = [
  body('studentId').isInt().withMessage('Valid student ID is required'),
  body('referringWiaProvider').optional().isLength({ max: 255 }).withMessage('Referring WIA provider must be less than 255 characters'),
  body('caseManagerName').optional().isLength({ max: 255 }).withMessage('Case manager name must be less than 255 characters'),
  body('caseManagerTelephone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('trainingProvider').optional().isLength({ max: 255 }).withMessage('Training provider must be less than 255 characters'),
  body('instructorName').optional().isLength({ max: 255 }).withMessage('Instructor name must be less than 255 characters'),
  body('programName').optional().isLength({ max: 255 }).withMessage('Program name must be less than 255 characters'),
  body('trainingPeriodStartDate').optional().custom((value) => {
    if (!value) return true; // Allow empty values
    const date = new Date(value);
    return !isNaN(date.getTime()) || 'Valid start date is required';
  }).withMessage('Valid start date is required'),
  body('trainingPeriodEndDate').optional().custom((value) => {
    if (!value) return true; // Allow empty values
    const date = new Date(value);
    return !isNaN(date.getTime()) || 'Valid end date is required';
  }).withMessage('Valid end date is required')
];

// @route   GET /api/vouchers
// @desc    Get all students with their voucher information
// @access  Private
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createStudentsVouchersTable(db);

    const sql = `
      SELECT 
        s.id as student_id,
        s.first_name,
        s.last_name,
        s.email,
        s.registration_number,
        sv.id as voucher_id,
        sv.referring_wia_provider,
        sv.case_manager_name,
        sv.case_manager_telephone,
        sv.training_provider,
        sv.instructor_name,
        sv.program_name,
        sv.training_period_start_date,
        sv.training_period_end_date,
        sv.voucher_file_path,
        sv.created_at,
        sv.updated_at
      FROM students s
      LEFT JOIN students_vouchers sv ON s.id = sv.student_id
      ORDER BY s.first_name, s.last_name
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching students with vouchers:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
console.log("results", results);
      res.json({ success: true, data: results });
    });
  } catch (error) {
    console.error("Error in GET /api/vouchers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   GET /api/vouchers/:id
// @desc    Get voucher by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createStudentsVouchersTable(db);

    const sql = `
      SELECT 
        sv.id,
        sv.student_id,
        sv.referring_wia_provider,
        sv.case_manager_name,
        sv.case_manager_telephone,
        sv.training_provider,
        sv.instructor_name,
        sv.program_name,
        sv.training_period_start_date,
        sv.training_period_end_date,
        sv.voucher_file_path,
        sv.created_at,
        sv.updated_at,
        s.first_name,
        s.last_name,
        s.email,
        s.registration_number
      FROM students_vouchers sv
      LEFT JOIN students s ON sv.student_id = s.id
      WHERE sv.id = ?
    `;

    db.query(sql, [req.params.id], (err, results) => {
      if (err) {
        console.error("Error fetching voucher:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "Voucher not found" });
      }

      res.json({ success: true, data: results[0] });
    });
  } catch (error) {
    console.error("Error in GET /api/vouchers/:id:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   POST /api/vouchers
// @desc    Create new voucher
// @access  Private
router.post('/', handleVoucherFileUpload(), validateVoucher, async (req, res) => {
console.log("POST /api/vouchers - req.body", req.body);
console.log("POST /api/vouchers - req.files", req.files);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('POST Validation errors:', errors.array());
      // Clean up any uploaded files if validation fails
      if (req.files) {
        Object.values(req.files).forEach(fileArray => {
          fileArray.forEach(file => {
            try {
              fs.unlinkSync(file.path);
            } catch (unlinkError) {
              console.error('Error deleting file:', unlinkError);
            }
          });
        });
      }
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const db = req.app.locals.db;
    await createStudentsVouchersTable(db);

    const {
      studentId,
      referringWiaProvider,
      caseManagerName,
      caseManagerTelephone,
      trainingProvider,
      instructorName,
      programName,
      trainingPeriodStartDate,
      trainingPeriodEndDate
    } = req.body;
    // Handle file upload
    const voucherFilePath = req.files && req.files['voucherFile'] && req.files['voucherFile'][0]
      ? getRelativePath('voucher', `student_${studentId}`, req.files['voucherFile'][0].filename)
      : null;

    // Check if student exists
    const checkStudentSql = "SELECT id FROM students WHERE id = ?";
    db.query(checkStudentSql, [studentId], (studentErr, studentResult) => {
      if (studentErr) {
        console.error("Error checking student existence:", studentErr);
        // Clean up uploaded files
        if (req.files) {
          Object.values(req.files).forEach(fileArray => {
            fileArray.forEach(file => {
              try {
                fs.unlinkSync(file.path);
              } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
              }
            });
          });
        }
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (studentResult.length === 0) {
        // Clean up uploaded files
        if (req.files) {
          Object.values(req.files).forEach(fileArray => {
            fileArray.forEach(file => {
              try {
                fs.unlinkSync(file.path);
              } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
              }
            });
          });
        }
        return res.status(400).json({ success: false, message: "Student not found" });
      }

      // Insert voucher
      const insertSql = `
        INSERT INTO students_vouchers (
          student_id, referring_wia_provider, case_manager_name, case_manager_telephone,
          training_provider, instructor_name, program_name, training_period_start_date,
          training_period_end_date, voucher_file_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        studentId,
        referringWiaProvider || null,
        caseManagerName || null,
        caseManagerTelephone || null,
        trainingProvider || null,
        instructorName || null,
        programName || null,
        trainingPeriodStartDate || null,
        trainingPeriodEndDate || null,
        voucherFilePath
      ];

      db.query(insertSql, values, (insertErr, insertResult) => {
        if (insertErr) {
          console.error("Error inserting voucher:", insertErr);
          // Clean up uploaded files
          if (req.files) {
            Object.values(req.files).forEach(fileArray => {
              fileArray.forEach(file => {
                try {
                  fs.unlinkSync(file.path);
                } catch (unlinkError) {
                  console.error('Error deleting file:', unlinkError);
                }
              });
            });
          }
          return res.status(500).json({ success: false, message: "Database error" });
        }

        res.status(201).json({
          success: true,
          message: "Voucher created successfully",
          data: { id: insertResult.insertId }
        });
      });
    });
  } catch (error) {
    console.error("Error in POST /api/vouchers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   PUT /api/vouchers/:id
// @desc    Update voucher
// @access  Private
router.put('/:id', handleVoucherFileUpload(), validateVoucher, async (req, res) => {
  try {
    console.log('PUT /api/vouchers/:id - Request body:', req.body);
    console.log('PUT /api/vouchers/:id - Request files:', req.files);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      // Clean up any uploaded files if validation fails
      if (req.files) {
        Object.values(req.files).forEach(fileArray => {
          fileArray.forEach(file => {
            try {
              fs.unlinkSync(file.path);
            } catch (unlinkError) {
              console.error('Error deleting file:', unlinkError);
            }
          });
        });
      }
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const db = req.app.locals.db;
    await createStudentsVouchersTable(db);

    const voucherId = req.params.id;
    const {
      studentId,
      referringWiaProvider,
      caseManagerName,
      caseManagerTelephone,
      trainingProvider,
      instructorName,
      programName,
      trainingPeriodStartDate,
      trainingPeriodEndDate
    } = req.body;
console.log(req.body);
    // First check if voucher exists
    const checkVoucherSql = "SELECT voucher_file_path FROM students_vouchers WHERE id = ?";
    db.query(checkVoucherSql, [voucherId], (checkErr, checkResult) => {
      if (checkErr) {
        console.error("Error checking voucher existence:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (checkResult.length === 0) {
        return res.status(404).json({ success: false, message: "Voucher not found" });
      }

      let voucherFilePath = checkResult[0].voucher_file_path;

      // Handle new file upload
      if (req.files && req.files['voucherFile'] && req.files['voucherFile'][0]) {
        // Delete old file if exists
        if (voucherFilePath) {
          const oldFilePath = getAbsolutePath('voucher', null, voucherFilePath.split('/').pop());
          try {
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          } catch (unlinkError) {
            console.error('Error deleting old file:', unlinkError);
          }
        }

        // Set new file path
        voucherFilePath = getRelativePath('voucher', `student_${studentId}`, req.files['voucherFile'][0].filename);
      }

      // Update voucher
      const updateSql = `
        UPDATE students_vouchers SET
          student_id = ?,
          referring_wia_provider = ?,
          case_manager_name = ?,
          case_manager_telephone = ?,
          training_provider = ?,
          instructor_name = ?,
          program_name = ?,
          training_period_start_date = ?,
          training_period_end_date = ?,
          voucher_file_path = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const values = [
        studentId,
        referringWiaProvider || null,
        caseManagerName || null,
        caseManagerTelephone || null,
        trainingProvider || null,
        instructorName || null,
        programName || null,
        trainingPeriodStartDate || null,
        trainingPeriodEndDate || null,
        voucherFilePath,
        voucherId
      ];

      db.query(updateSql, values, (updateErr, updateResult) => {
        if (updateErr) {
          console.error("Error updating voucher:", updateErr);
          return res.status(500).json({ success: false, message: "Database error" });
        }

        res.json({
          success: true,
          message: "Voucher updated successfully"
        });
      });
    });
  } catch (error) {
    console.error("Error in PUT /api/vouchers/:id:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   DELETE /api/vouchers/:id
// @desc    Delete voucher
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createStudentsVouchersTable(db);

    const voucherId = req.params.id;

    // First get the voucher to delete associated file
    const getVoucherSql = "SELECT voucher_file_path FROM students_vouchers WHERE id = ?";
    db.query(getVoucherSql, [voucherId], (getErr, getResult) => {
      if (getErr) {
        console.error("Error getting voucher:", getErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (getResult.length === 0) {
        return res.status(404).json({ success: false, message: "Voucher not found" });
      }

      // Delete associated file if exists
      const voucherFilePath = getResult[0].voucher_file_path;
      if (voucherFilePath) {
        const filePath = getAbsolutePath('voucher', null, voucherFilePath.split('/').pop());
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }

      // Delete voucher from database
      const deleteSql = "DELETE FROM students_vouchers WHERE id = ?";
      db.query(deleteSql, [voucherId], (deleteErr, deleteResult) => {
        if (deleteErr) {
          console.error("Error deleting voucher:", deleteErr);
          return res.status(500).json({ success: false, message: "Database error" });
        }

        res.json({
          success: true,
          message: "Voucher deleted successfully"
        });
      });
    });
  } catch (error) {
    console.error("Error in DELETE /api/vouchers/:id:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   GET /api/vouchers/student/:studentId
// @desc    Get vouchers by student ID
// @access  Private
router.get('/student/:studentId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await createStudentsVouchersTable(db);

    const sql = `
      SELECT 
        sv.id,
        sv.student_id,
        sv.referring_wia_provider,
        sv.case_manager_name,
        sv.case_manager_telephone,
        sv.training_provider,
        sv.instructor_name,
        sv.program_name,
        sv.training_period_start_date,
        sv.training_period_end_date,
        sv.voucher_file_path,
        sv.created_at,
        sv.updated_at,
        s.first_name,
        s.last_name,
        s.email,
        s.registration_number
      FROM students_vouchers sv
      LEFT JOIN students s ON sv.student_id = s.id
      WHERE sv.student_id = ?
      ORDER BY sv.created_at DESC
    `;

    db.query(sql, [req.params.studentId], (err, results) => {
      if (err) {
        console.error("Error fetching student vouchers:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      res.json({ success: true, data: results });
    });
  } catch (error) {
    console.error("Error in GET /api/vouchers/student/:studentId:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
