// Required imports for file handling and hashing
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For password hashing
const multer = require('multer'); // For handling multipart/form-data
const { body, validationResult } = require('express-validator'); // For validation
const fs = require('fs'); // For file system operations
const path = require('path'); // For path operations

// --- Multer Configuration for File Uploads ---
// Dynamic storage configuration that creates user-specific folders
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Get email from request body (will be available after multer processes the form)
    const email = req.body.email;

    if (!email) {
      return cb(new Error('Email is required for file upload'), null);
    }

    // Create a safe folder name from email (remove special characters)
    const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
    const userFolder = path.join('uploads', 'students', safeEmail);

    // Create the directory if it doesn't exist
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }

    cb(null, userFolder);
  },
  filename: function (req, file, cb) {
    // Map field names to specific file names
    const fieldToFileName = {
      'photo': 'profile',
      'dlUpload': 'DL',
      'socialSecurityUpload': 'SSN',
      'taraItaPacketUpload': 'taraIT',
      'voucherDates': 'voucherDates'
    };

    // Get the base filename from the mapping
    const baseFileName = fieldToFileName[file.fieldname] || file.fieldname;

    // Get file extension from original filename
    const fileExtension = path.extname(file.originalname);

    // Create filename: baseName.extension (e.g., profile.jpg, DL.pdf)
    const fileName = `${baseFileName}${fileExtension}`;

    cb(null, fileName);
  }
});

// Initialize multer upload middleware for multiple fields
const upload = multer({ storage: storage }).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'dlUpload', maxCount: 1 },
  { name: 'socialSecurityUpload', maxCount: 1 },
  { name: 'taraItaPacketUpload', maxCount: 1 },
  { name: 'voucherDates', maxCount: 1 }
]);

// Helper function to get relative path for database storage
const getRelativePath = (email, filename) => {
  const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
  return `/uploads/students/${safeEmail}/${filename}`;
};

// Helper function to get absolute path for file operations
const getAbsolutePath = (email, filename) => {
  const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
  return path.join(__dirname, '..', '..', 'uploads', 'students', safeEmail, filename);
};

// Function to create the 'students' table if it doesn't exist
// const createStudentsTable = (db) => {
//   return new Promise((resolve, reject) => {
//     const createTableSql = `
//             CREATE TABLE IF NOT EXISTS students (
//                 id INT AUTO_INCREMENT PRIMARY KEY,
//                 login_id VARCHAR(255) UNIQUE NOT NULL,
//                 -- IMPORTANT: If students use this password for login, it MUST be hashed!
//                 -- Add a VARCHAR(255) type for the password field if you include it.
//                 password VARCHAR(255), 
//                 first_name VARCHAR(255) NOT NULL,
//                 last_name VARCHAR(255) NOT NULL,
//                 email VARCHAR(255),
//                 phone VARCHAR(20),
//                 date_of_birth DATE,
//                 address_line1 VARCHAR(255),
//                 city VARCHAR(100),
//                 state VARCHAR(100),
//                 postal_code VARCHAR(20),
//                 country VARCHAR(100),
//                 registration_number VARCHAR(255) UNIQUE,
//                 date_of_joining DATE,
//                 gender VARCHAR(50),
//                 religion VARCHAR(100),
//                 nationality VARCHAR(100),
//                 photo VARCHAR(255), -- Store URL/path to photo
//                 course VARCHAR(255),
//                 department VARCHAR(255),
//                 student_notes TEXT,
//                 session VARCHAR(100),
//                 drivers_license VARCHAR(255),
//                 dl_upload VARCHAR(255), -- Store URL/path to DL upload
//                 student_pcp_info TEXT,
//                 student_pcp_phone VARCHAR(20),
//                 status VARCHAR(50),
//                 semester VARCHAR(50),
//                 social_security_number VARCHAR(255),
//                 social_security_upload VARCHAR(255), -- Store URL/path to SSN upload
//                 emergency_contact_info TEXT,
//                 emergency_contact_phone VARCHAR(20),
//                 other_emergency_contact TEXT,
//                 caseworker_name VARCHAR(255),
//                 workforce_center VARCHAR(255),
//                 tara_ita_packet_upload VARCHAR(255), -- Store URL/path to upload
//                 tara_ita_completion_date DATE,
//                 voucher_dates TEXT, -- Changed to TEXT to store path or list of dates
//                 info_session_date DATE,
//                 notes TEXT,
//                 course_pref1 VARCHAR(255),
//                 days_pref1 VARCHAR(255),
//                 location_pref1 VARCHAR(255),
//                 course_pref2 VARCHAR(255),
//                 days_pref2 VARCHAR(255),
//                 location_pref2 VARCHAR(255),
//                 attended_info_session BOOLEAN,
//                 info_session_location VARCHAR(255),
//                 additional_comments TEXT,
//                 signature TEXT, -- Changed from VARCHAR(255) to TEXT to store Base64 string
//                 name_capitalization VARCHAR(100),
//                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//             );
//         `;
//     db.query(createTableSql, (err) => {
//       if (err) {
//         console.error("Error creating students table:", err);
//         return reject(new Error("Failed to create students table."));
//       }
//       resolve();
//     });
//   });
// };

// Validation middleware
const validateStudent = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'), // Corrected to 'phone'
  body('dateOfBirth').optional().isDate().withMessage('Valid date of birth is required'),
  body('loginId').notEmpty().withMessage('Login ID is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('course').notEmpty().withMessage('Course is required'),
  body('session').notEmpty().withMessage('Session is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
  // Updated SSN validation to accept XXX-XX-XXXX format
  body('socialSecurityNumber').optional().matches(/^\d{3}-\d{2}-\d{4}$/).withMessage('SSN must be in XXX-XX-XXXX format'),
  body('driversLicense').optional().notEmpty().withMessage('Driver\'s license number is required if provided')
];

// @route   POST /api/students
// @desc    Add new student with file uploads
// @access  Private
router.post('/', upload, validateStudent, async (req, res) => {

  console.log("Target req.body", req.body);
  try {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
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
      console.log("Data Validation Phase 2 error:", errors);
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const db = req.app.locals.db;
    // await createStudentsTable(db);

    // Destructure fields from req.body
    const {
      firstName, lastName, email, phone, dateOfBirth,
      loginId, password, course, department, studentNotes,
      session, driversLicense, studentPcpInfo, studentPcpPhone,
      status, semester, socialSecurityNumber, emergencyContactInfo,
      emergencyContactPhone, otherEmergencyContact, caseworkerName,
      workforceCenter, taraItaCompletionDate, infoSessionDate,
      notes, coursePref1, daysPref1, locationPref1, coursePref2,
      daysPref2, locationPref2, attendedInfoSession, infoSessionLocation,
      additionalComments, signature, nameCapitalization,
      addressLine1, city, state, postalCode, country,
      gender, religion, nationality, registrationNumber, dateOfJoining
    } = req.body;

    const photoPath = req.files && req.files['photo'] && req.files['photo'][0]
      ? getRelativePath(email, req.files['photo'][0].filename)
      : null;


    const dlUploadPath = req.files && req.files['dlUpload'] && req.files['dlUpload'][0]
      ? getRelativePath(email, req.files['dlUpload'][0].filename)
      : null;


    const ssnUploadPath = req.files && req.files['socialSecurityUpload'] && req.files['socialSecurityUpload'][0]
      ? getRelativePath(email, req.files['socialSecurityUpload'][0].filename)
      : null;

    const taraItaPath = req.files && req.files['taraItaPacketUpload'] && req.files['taraItaPacketUpload'][0]
      ? getRelativePath(email, req.files['taraItaPacketUpload'][0].filename)
      : null;


    const voucherDatesPath = req.files && req.files['voucherDates'] && req.files['voucherDates'][0]
      ? getRelativePath(email, req.files['voucherDates'][0].filename)
      : null;


    // First check if email already exists
    const checkEmailSql = "SELECT id FROM students WHERE email = ?";
    db.query(checkEmailSql, [email], async (emailErr, emailResult) => {
      if (emailErr) {
        console.error("Error checking email existence:", emailErr);
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

      if (emailResult.length > 0) {
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
        return res.status(400).json({
          success: false,
          message: "Student with this email already exists"
        });
      }

      // If email is unique, then check login ID
      const checkLoginSql = "SELECT id FROM students WHERE login_id = ?";
      db.query(checkLoginSql, [loginId], async (loginErr, loginResult) => {
        if (loginErr) {
          console.error("Error checking login ID existence:", loginErr);
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

        if (loginResult.length > 0) {
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
          return res.status(400).json({
            success: false,
            message: "Student with this login ID already exists"
          });
        }

        // Both email and login ID are unique, proceed with registration
        try {
          // Hash password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          // Insert student record
          const insertSql = `
            INSERT INTO students (
                login_id, password, first_name, last_name, email, phone,
                date_of_birth, course, department, student_notes, session,
                drivers_license, dl_upload, student_pcp_info, student_pcp_phone,
                status, semester, social_security_number, social_security_upload,
                emergency_contact_info, emergency_contact_phone, other_emergency_contact,
                caseworker_name, workforce_center, tara_ita_packet_upload,
                tara_ita_completion_date, voucher_dates, info_session_date,
                notes, course_pref1, days_pref1, location_pref1, course_pref2,
                days_pref2, location_pref2, attended_info_session, info_session_location,
                additional_comments, signature, name_capitalization, photo,
                address_line1, city, state, postal_code, country,
                gender, religion, nationality,registration_number,date_of_joining
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const attendedInfoSessionValue = attendedInfoSession === "true" ? 1 : 0;

          const values = [
            loginId, hashedPassword, firstName, lastName, email, phone,
            dateOfBirth, course, department, studentNotes, session,
            driversLicense, dlUploadPath, studentPcpInfo, studentPcpPhone,
            status || 'Active', semester, socialSecurityNumber, ssnUploadPath,
            emergencyContactInfo, emergencyContactPhone, otherEmergencyContact,
            caseworkerName, workforceCenter, taraItaPath,
            taraItaCompletionDate, voucherDatesPath, infoSessionDate,
            notes, coursePref1, daysPref1, locationPref1, coursePref2,
            daysPref2, locationPref2, attendedInfoSessionValue, infoSessionLocation,
            additionalComments, signature, nameCapitalization, photoPath,
            addressLine1, city, state, postalCode, country,
            gender, religion, nationality, registrationNumber, dateOfJoining
          ];

          db.query(insertSql, values, (insertErr, insertResult) => {
            if (insertErr) {
              console.error("Error inserting student:", insertErr);
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
              console.log("Error creating student record", insertErr);
              return res.status(500).json({
                success: false,
                message: "Error creating student record"
              });
            }

            res.json({
              success: true,
              message: "Student registered successfully",
              studentId: insertResult.insertId
            });
          });
        } catch (hashError) {
          console.error("Error hashing password:", hashError);
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
          return res.status(500).json({
            success: false,
            message: "Error processing registration"
          });
        }
      });
    });
  } catch (error) {
    console.error("Server error in POST /students:", error);
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
    res.status(500).json({
      success: false,
      message: "Server error while registering student"
    });
  }
});

router.post('/joomla-registration', upload, validateStudent, async (req, res) => {
  console.log("Target req.body", req.body);
  console.log("req.files", req.files);
  
  try {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      // Clean up any uploaded files if validation fails
      if (req.files) {
        console.log("req.files", req.files);
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
      console.log("Data Validation Phase 2 error:", errors);
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const db = req.app.locals.db;
    // await createStudentsTable(db);

    // Destructure fields from req.body
    const {
      firstName, lastName, email, phone, dateOfBirth,
      loginId, password, course, department, studentNotes,
      session, driversLicense, studentPcpInfo, studentPcpPhone,
      status, semester, socialSecurityNumber, emergencyContactInfo,
      emergencyContactPhone, otherEmergencyContact, caseworkerName,
      workforceCenter, taraItaCompletionDate, infoSessionDate,
      notes, coursePref1, daysPref1, locationPref1, coursePref2,
      daysPref2, locationPref2, attendedInfoSession, infoSessionLocation,
      additionalComments, signature, nameCapitalization,
      addressLine1, city, state, postalCode, country,
      gender, religion, nationality, registrationNumber, dateOfJoining
    } = req.body;

    const photoPath = req.files && req.files['photo'] && req.files['photo'][0]
      ? getRelativePath(email, req.files['photo'][0].filename)
      : null;


    const dlUploadPath = req.files && req.files['dlUpload'] && req.files['dlUpload'][0]
      ? getRelativePath(email, req.files['dlUpload'][0].filename)
      : null;


    const ssnUploadPath = req.files && req.files['socialSecurityUpload'] && req.files['socialSecurityUpload'][0]
      ? getRelativePath(email, req.files['socialSecurityUpload'][0].filename)
      : null;

    const taraItaPath = req.files && req.files['taraItaPacketUpload'] && req.files['taraItaPacketUpload'][0]
      ? getRelativePath(email, req.files['taraItaPacketUpload'][0].filename)
      : null;


    const voucherDatesPath = req.files && req.files['voucherDates'] && req.files['voucherDates'][0]
      ? getRelativePath(email, req.files['voucherDates'][0].filename)
      : null;

    console.log("Photo Path",photoPath,  "dlUploadPath",dlUploadPath, "ssnUploadPath",ssnUploadPath, "taraItaPath",taraItaPath, "voucherDatesPath",voucherDatesPath);

    // First check if email already exists
    const checkEmailSql = "SELECT id FROM students WHERE email = ?";
    db.query(checkEmailSql, [email], async (emailErr, emailResult) => {
      if (emailErr) {
        console.error("Error checking email existence:", emailErr);
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

      if (emailResult.length > 0) {
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
        return res.status(400).json({
          success: false,
          message: "Student with this email already exists"
        });
      }

      // If email is unique, then check login ID
      const checkLoginSql = "SELECT id FROM students WHERE login_id = ?";
      db.query(checkLoginSql, [loginId], async (loginErr, loginResult) => {
        if (loginErr) {
          console.error("Error checking login ID existence:", loginErr);
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

        if (loginResult.length > 0) {
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
          return res.status(400).json({
            success: false,
            message: "Student with this login ID already exists"
          });
        }

        // Both email and login ID are unique, proceed with registration
        try {
          // Hash password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          // Insert student record
          const insertSql = `
            INSERT INTO students (
                login_id, password, first_name, last_name, email, phone,
                date_of_birth, course, department, student_notes, session,
                drivers_license, dl_upload, student_pcp_info, student_pcp_phone,
                status, semester, social_security_number, social_security_upload,
                emergency_contact_info, emergency_contact_phone, other_emergency_contact,
                caseworker_name, workforce_center, tara_ita_packet_upload,
                tara_ita_completion_date, voucher_dates, info_session_date,
                notes, course_pref1, days_pref1, location_pref1, course_pref2,
                days_pref2, location_pref2, attended_info_session, info_session_location,
                additional_comments, signature, name_capitalization, photo,
                address_line1, city, state, postal_code, country,
                gender, religion, nationality,registration_number,date_of_joining
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const attendedInfoSessionValue = attendedInfoSession === "true" ? 1 : 0;

          const values = [
            loginId, hashedPassword, firstName, lastName, email, phone,
            dateOfBirth, course, department, studentNotes, session,
            driversLicense, dlUploadPath, studentPcpInfo, studentPcpPhone,
            status || 'Active', semester, socialSecurityNumber, ssnUploadPath,
            emergencyContactInfo, emergencyContactPhone, otherEmergencyContact,
            caseworkerName, workforceCenter, taraItaPath,
            taraItaCompletionDate, voucherDatesPath, infoSessionDate,
            notes, coursePref1, daysPref1, locationPref1, coursePref2,
            daysPref2, locationPref2, attendedInfoSessionValue, infoSessionLocation,
            additionalComments, signature, nameCapitalization, photoPath,
            addressLine1, city, state, postalCode, country,
            gender, religion, nationality, registrationNumber, dateOfJoining
          ];

          db.query(insertSql, values, (insertErr, insertResult) => {
            if (insertErr) {
              console.error("Error inserting student:", insertErr);
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
              console.log("Error creating student record", insertErr);
              return res.status(500).json({
                success: false,
                message: "Error creating student record"
              });
            }

            res.json({
              success: true,
              message: "Student registered successfully",
              studentId: insertResult.insertId
            });
          });
        } catch (hashError) {
          console.error("Error hashing password:", hashError);
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
          return res.status(500).json({
            success: false,
            message: "Error processing registration"
          });
        }
      });
    });
  } catch (error) {
    console.error("Server error in POST /students:", error);
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
    res.status(500).json({
      success: false,
      message: "Server error while registering student"
    });
  }
});


router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;

    // SQL query to fetch all students with their basic information
    const sql = `
            SELECT 
                id,
                first_name as firstName,
                last_name as lastName,
                email,
                phone,
                created_at as enrollmentDate,
                status,
                gender,
                course,
                SUBSTRING(social_security_number, -4) as last_four_ssn,
                course_pref1,
                days_pref1,
                location_pref1,
                course_pref2,
                days_pref2,
                location_pref2,
                date_of_birth
            FROM students 
            ORDER BY created_at DESC
        `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching students:", err);
        return res.status(500).json({
          success: false,
          message: "Database error while fetching students"
        });
      }

      // Transform the results to match the frontend expected format
      const students = results.map(student => ({
        ...student,
        // Ensure dates are in ISO format
        enrollmentDate: student.enrollmentDate ? new Date(student.enrollmentDate).toISOString().split('T')[0] : null,
      }));

      res.json({
        success: true,
        students,
        total: students.length
      });
    });
  } catch (error) {
    console.error("Server error in GET /students:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching students"
    });
  }
});


// @route   POST /api/students/assign-course
// @desc    Assign course, session, and preferences to a student
// @access  Private
router.post('/assign-course', async (req, res) => {
  console.log("req.body", req.body);
  try {
    const { studentId, course, session, firstChoice, secondChoice } = req.body;
    if (!studentId || !course || !session) {
      return res.status(400).json({ success: false, message: 'Student, course, and session are required.' });
    }
    const db = req.app.locals.db;
    // Build update query
    const sql = `UPDATE students SET course = ?, session = ?, course_pref1 = ?, location_pref1 = ?, days_pref1 = ?, course_pref2 = ?, location_pref2 = ?, days_pref2 = ? WHERE id = ?`;
    const values = [
      course,
      session,
      firstChoice?.courseInterestedIn || '',
      firstChoice?.locationPreference || '',
      firstChoice?.daysPreferred || '',
      secondChoice?.courseInterestedIn || '',
      secondChoice?.locationPreference || '',
      secondChoice?.daysPreferred || '',
      studentId
    ];
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error assigning course:', err);
        return res.status(500).json({ success: false, message: 'Database error while assigning course.' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Student not found.' });
      }
      res.json({ success: true, message: 'Course assigned successfully.' });
    });
  } catch (error) {
    console.error('Server error in POST /students/assign-course:', error);
    res.status(500).json({ success: false, message: 'Server error while assigning course.' });
  }
});

// @route   PUT /api/students/:id/status
// @desc    Update student status
// @access  Private
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = req.app.locals.db;

    // Validate status
    const validStatuses = ['Active', 'Inactive', 'Pending', 'Approved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of: Active, Inactive, Pending, Approved' 
      });
    }

    // Check if student exists
    const checkQuery = 'SELECT id, first_name, last_name FROM students WHERE id = ?';
    db.query(checkQuery, [id], (err, existingStudent) => {
      if (err) {
        console.error('Error checking student:', err);
        return res.status(500).json({ success: false, message: 'Database error while checking student' });
      }
      if (existingStudent.length === 0) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // Update student status
      const updateQuery = 'UPDATE students SET status = ? WHERE id = ?';
      db.query(updateQuery, [status, id], (updateErr, result) => {
        if (updateErr) {
          console.error('Error updating student status:', updateErr);
          return res.status(500).json({ success: false, message: 'Database error while updating status' });
        }

        // Log the activity
        const student = existingStudent[0];
        const activityMessage = `Updated status of student ${student.first_name} ${student.last_name} (ID: ${id}) to ${status}`;
        
        // Import and use activity logger if available
        try {
          const { logActivity } = require('../utils/activityLogger');
          logActivity('Student', 'UPDATE', activityMessage, req.user?.id);
        } catch (loggerError) {
          console.log('Activity logger not available:', loggerError.message);
        }

        res.json({ 
          success: true, 
          message: `Student status updated to ${status} successfully`,
          data: {
            id: parseInt(id),
            status: status,
            studentName: `${student.first_name} ${student.last_name}`
          }
        });
      });
    });
  } catch (error) {
    console.error('Server error in PUT /students/:id/status:', error);
    res.status(500).json({ success: false, message: 'Server error while updating student status' });
  }
});

// @route   GET /api/students/:id/details
// @desc    Get comprehensive student details including all related information
// @access  Private
router.get('/:id/details', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    // Get basic student information
    const studentQuery = `
      SELECT 
        s.*,
        c.course_name as course_name,
        ses.session_name as session_name,
        CONCAT(i.name) as instructor_name
      FROM students s
      LEFT JOIN courses c ON s.course = c.course_name
      LEFT JOIN sessions ses ON s.session = ses.session_name
      LEFT JOIN instructors i ON c.instructor_id = i.id
      WHERE s.id = ?
    `;

    db.query(studentQuery, [id], async (studentErr, studentResults) => {
      if (studentErr) {
        console.error('Error fetching student:', studentErr);
        return res.status(500).json({ success: false, message: 'Database error while fetching student' });
      }

      if (studentResults.length === 0) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      const student = studentResults[0];

      // Get workforce information (already in students table)
      const workforceQuery = `
        SELECT 
          caseworker_name,
          workforce_center,
          tara_ita_packet_upload,
          tara_ita_completion_date,
          voucher_dates
        FROM students 
        WHERE id = ?
      `;

      // Get attendance records
      const attendanceQuery = `
        SELECT 
          a.id,
          a.attendance_date as date,
          a.status,
          a.notes,
          CONCAT(s.first_name, ' ', s.last_name) as student_name,
          c.course_name as course_name
        FROM attendance a
        LEFT JOIN students s ON a.student_id = s.id
        LEFT JOIN sessions ses ON a.session_id = ses.id
        LEFT JOIN courses c ON ses.course_id = c.id
        WHERE a.student_id = ?
        ORDER BY a.attendance_date DESC
      `;

      // Get grades (if grades table exists)
      const gradesQuery = `
        SELECT 
          g.id,
          g.student_id,
          g.points_scored,
          g.notes,
          g.created_at,
          gc.column_name,
          gc.max_points,
          gc.include_in_calculation,
          gcat.category_name,
          c.course_name,
          ses.session_name,
          CONCAT(i.name) as instructor_name
        FROM grades g
        LEFT JOIN grade_columns gc ON g.column_id = gc.id
        LEFT JOIN grade_categories gcat ON gc.category_id = gcat.id
        LEFT JOIN courses c ON gc.course_id = c.id
        LEFT JOIN sessions ses ON g.session_id = ses.id
        LEFT JOIN instructors i ON c.instructor_id = i.id
        WHERE g.student_id = ?
        ORDER BY g.created_at DESC
      `;

      // Get signed documents (if documents table exists)
      const documentsQuery = `
        SELECT 
          d.id,
          d.document_type,
          d.file_path,
          d.upload_date,
          d.notes,
          c.course_name,
          ses.session_name
        FROM documents d
        LEFT JOIN students s ON d.student_id = s.id
        LEFT JOIN courses c ON s.course = c.course_name
        LEFT JOIN sessions ses ON d.session_id = ses.id
        WHERE d.student_id = ?
        ORDER BY d.upload_date DESC
      `;

      // Get signed ITA attendance
      const itaAttendanceQuery = `
        SELECT 
          sia.id,
          sia.session_date as date,
          sia.student_signature,
          sia.instructor_signature,
          sia.status,
          sia.hours_completed,
          sia.total_hours_accumulated,
          sia.notes,
          sia.created_at,
          c.course_name,
          ses.session_name,
          CONCAT(i.name) as instructor_name
        FROM signed_ita_attendance sia
        LEFT JOIN students s ON sia.student_id = s.id
        LEFT JOIN ita_master im ON sia.ita_master_id = im.id
        LEFT JOIN courses c ON im.course_id = c.id
        LEFT JOIN sessions ses ON sia.session_date = ses.session_date
        LEFT JOIN instructors i ON sia.instructor_id = i.id
        WHERE sia.student_id = ?
        ORDER BY sia.session_date DESC
      `;

      // Get previous courses (if previous_courses table exists)
      const previousCoursesQuery = `
        SELECT 
          pc.id,
          pc.course_name,
          pc.session_name,
          pc.moved_date,
          pc.student_course_status,
          pc.notes,
          pc.created_at
        FROM previous_courses pc
        WHERE pc.student_id = ?
        ORDER BY pc.moved_date DESC
      `;

      // Execute all queries in parallel
      db.query(workforceQuery, [id], (workforceErr, workforceResults) => {
        db.query(attendanceQuery, [id], (attendanceErr, attendanceResults) => {
          db.query(gradesQuery, [id], (gradesErr, gradesResults) => {
            db.query(documentsQuery, [id], (documentsErr, documentsResults) => {
              db.query(itaAttendanceQuery, [id], (itaErr, itaResults) => {
                db.query(previousCoursesQuery, [id], (prevErr, prevResults) => {
                  
                  // Check for errors (but don't fail if some tables don't exist)
                  const errors = [];
                  if (workforceErr) errors.push('workforce');
                  if (attendanceErr && !attendanceErr.message.includes("doesn't exist")) errors.push('attendance');
                  if (gradesErr && !gradesErr.message.includes("doesn't exist")) errors.push('grades');
                  if (documentsErr && !documentsErr.message.includes("doesn't exist")) errors.push('documents');
                  if (itaErr && !itaErr.message.includes("doesn't exist")) errors.push('ita');
                  if (prevErr && !prevErr.message.includes("doesn't exist")) errors.push('previous_courses');
                  
                  if (errors.length > 0) {
                    console.error('Errors fetching related data:', errors);
                  }

                  // Format the response
                  const studentDetails = {
                    // Basic student information
                    student: {
                      id: student.id,
                      registrationNumber: student.registration_number,
                      firstName: student.first_name,
                      lastName: student.last_name,
                      email: student.email,
                      phone: student.phone,
                      dateOfBirth: student.date_of_birth,
                      gender: student.gender,
                      address: `${student.address_line1 || ''} ${student.city || ''} ${student.state || ''} ${student.postal_code || ''}`.trim(),
                      emergencyContact: student.emergency_contact_info,
                      emergencyContactPhone: student.emergency_contact_phone,
                      otherEmergencyContact: student.other_emergency_contact,
                      course: student.course_name || student.course,
                      department: student.department,
                      session: student.session_name || student.session,
                      instructor: student.instructor_name,
                      semester: student.semester,
                      religion: student.religion,
                      nationality: student.nationality,
                      dateOfJoining: student.date_of_joining,
                      socialSecurityNumber: student.social_security_number,
                      studentNotes: student.student_notes,
                      studentPcpInfo: student.student_pcp_info,
                      studentPcpPhone: student.student_pcp_phone,
                      status: student.status,
                      photo: student.photo,
                      dlUpload: student.dl_upload,
                      ssnUpload: student.social_security_upload,
                      addedTime: student.created_at
                    },

                    // Workforce information
                    workforce: {
                      caseworker: workforceResults[0]?.caseworker_name || '',
                      workforceCenter: workforceResults[0]?.workforce_center || '',
                      taraPacket: workforceResults[0]?.tara_ita_packet_upload || '',
                      taraCompletionDate: workforceResults[0]?.tara_ita_completion_date || '',
                      voucherDates: workforceResults[0]?.voucher_dates || ''
                    },

                    // Attendance records
                    attendance: attendanceErr ? [] : attendanceResults.map(att => ({
                      id: att.id,
                      date: att.date,
                      status: att.status,
                      notes: att.notes,
                      course: att.course_name
                    })),

                    // Grades
                    grades: gradesErr ? [] : gradesResults.map(grade => ({
                      id: grade.id,
                      session: grade.session_name,
                      category: grade.category_name,
                      name: grade.column_name,
                      maxPoints: grade.max_points,
                      pointsScored: grade.points_scored,
                      includeInCalculation: grade.include_in_calculation,
                      instructor: grade.instructor_name,
                      date: grade.created_at
                    })),

                    // Signed documents
                    documents: documentsErr ? [] : documentsResults.map(doc => ({
                      id: doc.id,
                      course: doc.course_name,
                      session: doc.session_name,
                      particulars: doc.document_type,
                      file: doc.file_path,
                      uploadDate: doc.upload_date,
                      notes: doc.notes
                    })),

                    // Signed ITA attendance
                    itaAttendance: itaErr ? [] : itaResults.map(ita => ({
                      id: ita.id,
                      date: ita.date,
                      status: ita.status,
                      hoursCompleted: ita.hours_completed,
                      totalHoursAccumulated: ita.total_hours_accumulated,
                      studentSignature: ita.student_signature,
                      instructorSignature: ita.instructor_signature,
                      instructor: ita.instructor_name,
                      course: ita.course_name,
                      session: ita.session_name,
                      notes: ita.notes,
                      createdDate: ita.created_at
                    })),

                    // Previous courses
                    previousCourses: prevErr ? [] : prevResults.map(prev => ({
                      id: prev.id,
                      course: prev.course_name,
                      session: prev.session_name,
                      movedDate: prev.moved_date,
                      status: prev.student_course_status,
                      notes: prev.notes
                    }))
                  };

                  res.json({
                    success: true,
                    studentDetails
                  });
                });
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Server error in GET /students/:id/details:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching student details' });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete a student
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    // Check if student exists
    const [student] = await db.promise().query('SELECT * FROM students WHERE id = ?', [id]);
    
    if (student.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get student email for file cleanup
    const studentEmail = student[0].email;
    const safeEmail = studentEmail ? studentEmail.replace(/[^a-zA-Z0-9]/g, '_') : null;

    // Delete student from database
    const [result] = await db.promise().query('DELETE FROM students WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Clean up uploaded files if they exist
    if (safeEmail) {
      const userFolder = path.join(__dirname, '..', '..', 'uploads', 'students', safeEmail);
      if (fs.existsSync(userFolder)) {
        try {
          fs.rmSync(userFolder, { recursive: true, force: true });
        } catch (unlinkError) {
          console.error('Error deleting student files:', unlinkError);
        }
      }
    }

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting student' });
  }
});

// create a post route to save student enrollment data
router.post('/joomla-enrollment-form', upload, async (req, res) => {
    console.log("req.body", req.body);
    
    const db = req.app.locals.db;
    
    try {
        // Check if database connection is alive
        if (!db || db.state === 'disconnected') {
            return res.status(500).json({ 
                success: false, 
                message: 'Database connection not available' 
            });
        }

        const {
            enrollmentAgreementForm,
            medicalEvalForm,
            studentIDForm,
            uniformSizeForm,
            consentForm,
            backgroundCheckForm,
            acknowledgementForm,
            studentInfo
        } = req.body;

        // First, create or find the student
        let studentId;
        
        // Check if student already exists
        const [existingStudents] = await db.promise().query(
            'SELECT id FROM students WHERE email = ?',
            [studentInfo.email]
        );

        if (existingStudents.length > 0) {
            studentId = existingStudents[0].id;
            console.log('Found existing student with ID:', studentId);
        } else {
            // Create new student - using only the most basic columns that should exist
            const [studentResult] = await db.promise().query(
                'INSERT INTO students (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)',
                [
                    studentInfo.firstName,
                    studentInfo.lastName,
                    studentInfo.email,
                    studentInfo.phone
                ]
            );
            studentId = studentResult.insertId;
            console.log('Created new student with ID:', studentId);
        }

        // Create the enrollment tables first if they don't exist
        await createEnrollmentTables(db);

        // Insert Enrollment Agreement Form
        const [enrollmentAgreementResult] = await db.promise().query(
            `INSERT INTO enrollment_agreement_forms (
                student_id, enroll_student_name, enroll_student_id, enroll_address, enroll_city, 
                enroll_state, enroll_zip, enroll_ec_telephone, enroll_phone_h, enroll_phone_c, 
                enroll_phone_w, enroll_email, enroll_ssn, enroll_admission_date, enroll_program_name,
                enroll_program_description, enroll_program_start_date, enroll_scheduled_end_date,
                enroll_type, enroll_schedule_type, class_days, enroll_time_begins, enroll_time_ends,
                enroll_num_weeks, enroll_total_hours, aggrement_to_tuition_fees,
                aggrement_to_refund_and_cancellation_policy, reg_fee, program_cost, tuition,
                books_supplies, misc_expenses, other_expenses, total_cost, ack_catalog,
                ack_enrollment_agreement, ack_termination_policy, ack_consumer_info,
                ack_transferability, ack_job_placement, ack_complaints
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentId, enrollmentAgreementForm.enroll_student_name, enrollmentAgreementForm.enroll_student_id,
                enrollmentAgreementForm.enroll_address, enrollmentAgreementForm.enroll_city,
                enrollmentAgreementForm.enroll_state, enrollmentAgreementForm.enroll_zip,
                enrollmentAgreementForm.enroll_ec_telephone, enrollmentAgreementForm.enroll_phone_h,
                enrollmentAgreementForm.enroll_phone_c, enrollmentAgreementForm.enroll_phone_w,
                enrollmentAgreementForm.enroll_email, enrollmentAgreementForm.enroll_ssn,
                enrollmentAgreementForm.enroll_admission_date, enrollmentAgreementForm.enroll_program_name,
                enrollmentAgreementForm.enroll_program_description, enrollmentAgreementForm.enroll_program_start_date,
                enrollmentAgreementForm.enroll_scheduled_end_date, enrollmentAgreementForm.enroll_type,
                enrollmentAgreementForm.enroll_schedule_type, enrollmentAgreementForm.class_days,
                enrollmentAgreementForm.enroll_time_begins, enrollmentAgreementForm.enroll_time_ends,
                enrollmentAgreementForm.enroll_num_weeks, enrollmentAgreementForm.enroll_total_hours,
                enrollmentAgreementForm.aggrement_to_tuition_fees,
                enrollmentAgreementForm.aggrement_to_refund_and_cancellation_policy,
                enrollmentAgreementForm.reg_fee, enrollmentAgreementForm.program_cost,
                enrollmentAgreementForm.tuition, enrollmentAgreementForm.books_supplies,
                enrollmentAgreementForm.misc_expenses, enrollmentAgreementForm.other_expenses,
                enrollmentAgreementForm.total_cost, enrollmentAgreementForm.ack_catalog,
                enrollmentAgreementForm.ack_enrollment_agreement, enrollmentAgreementForm.ack_termination_policy,
                enrollmentAgreementForm.ack_consumer_info, enrollmentAgreementForm.ack_transferability,
                enrollmentAgreementForm.ack_job_placement, enrollmentAgreementForm.ack_complaints
            ]
        );

        // Insert Medical Evaluation Form
        const [medicalEvalResult] = await db.promise().query(
            `INSERT INTO medical_evaluation_forms (
                student_id, program_nursing_assistant, med_birth_date, med_gender, med_home_phone,
                med_work_phone, med_cell_phone, em_full_name, em_relationship, em_address,
                em_city, state_select, em_zip, em_phone_home, em_phone_work, em_phone_cell,
                health_status, allergies, medications_present, meds_list, latex_allergy,
                food_allergy, food_list, pregnant, due_date, obgyn, lifting_restrictions,
                restrictions_explain, interfere_standards, interfere_explain, ack_med_eval_info,
                std_mobility, std_motor_skills, std_visual, std_hearing, std_tactile,
                std_communication, std_acquire_knowledge, std_clinical_judgment, std_professional_attitude
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentId, medicalEvalForm.program_nursing_assistant, medicalEvalForm.med_birth_date,
                medicalEvalForm.med_gender, medicalEvalForm.med_home_phone, medicalEvalForm.med_work_phone,
                medicalEvalForm.med_cell_phone, medicalEvalForm.em_full_name, medicalEvalForm.em_relationship,
                medicalEvalForm.em_address, medicalEvalForm.em_city, medicalEvalForm.state_select,
                medicalEvalForm.em_zip, medicalEvalForm.em_phone_home, medicalEvalForm.em_phone_work,
                medicalEvalForm.em_phone_cell, medicalEvalForm.health_status, medicalEvalForm.allergies,
                medicalEvalForm.medications_present, medicalEvalForm.meds_list, medicalEvalForm.latex_allergy,
                medicalEvalForm.food_allergy, medicalEvalForm.food_list, medicalEvalForm.pregnant,
                medicalEvalForm.due_date, medicalEvalForm.obgyn, medicalEvalForm.lifting_restrictions,
                medicalEvalForm.restrictions_explain, medicalEvalForm.interfere_standards,
                medicalEvalForm.interfere_explain, medicalEvalForm.ack_med_eval_info,
                medicalEvalForm.std_mobility, medicalEvalForm.std_motor_skills, medicalEvalForm.std_visual,
                medicalEvalForm.std_hearing, medicalEvalForm.std_tactile, medicalEvalForm.std_communication,
                medicalEvalForm.std_acquire_knowledge, medicalEvalForm.std_clinical_judgment,
                medicalEvalForm.std_professional_attitude
            ]
        );

        // Insert Student ID Form
        const [studentIDResult] = await db.promise().query(
            'INSERT INTO student_id_forms (student_id, id_lost_fee, id_terms_agree) VALUES (?, ?, ?)',
            [studentId, studentIDForm.id_lost_fee, studentIDForm.id_terms_agree]
        );

        // Insert Uniform Size Form
        const [uniformSizeResult] = await db.promise().query(
            'INSERT INTO uniform_size_forms (student_id, uniform_size) VALUES (?, ?)',
            [studentId, uniformSizeForm.uniform_size]
        );

        // Insert Consent Form
        const [consentResult] = await db.promise().query(
            'INSERT INTO consent_forms (student_id, consent_read_understand) VALUES (?, ?)',
            [studentId, consentForm.consent_read_understand]
        );

        // Insert Background Check Form
        const [backgroundCheckResult] = await db.promise().query(
            `INSERT INTO background_check_forms (
                student_id, bc_first_name, bc_full_middle_name, bc_last_name, bc_mailing_address,
                bc_city, bc_state, bc_zip, bc_other_names, bc_telephone, bc_states_lived,
                bc_gender, bc_race, bc_height_ft, bc_height_in, bc_weight, bc_dob, bc_ssn,
                bc_hair_color, bc_eye_color, bc_place_of_birth, bc_abuse, bc_abuse_details,
                bc_convicted, bc_convicted_details, bc_parent_signature_data, bc_parent_signature_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentId, backgroundCheckForm.bc_first_name, backgroundCheckForm.bc_full_middle_name,
                backgroundCheckForm.bc_last_name, backgroundCheckForm.bc_mailing_address,
                backgroundCheckForm.bc_city, backgroundCheckForm.bc_state, backgroundCheckForm.bc_zip,
                backgroundCheckForm.bc_other_names, backgroundCheckForm.bc_telephone,
                backgroundCheckForm.bc_states_lived, backgroundCheckForm.bc_gender,
                backgroundCheckForm.bc_race, backgroundCheckForm.bc_height_ft,
                backgroundCheckForm.bc_height_in, backgroundCheckForm.bc_weight,
                backgroundCheckForm.bc_dob, backgroundCheckForm.bc_ssn,
                backgroundCheckForm.bc_hair_color, backgroundCheckForm.bc_eye_color,
                backgroundCheckForm.bc_place_of_birth, backgroundCheckForm.bc_abuse,
                backgroundCheckForm.bc_abuse_details, backgroundCheckForm.bc_convicted,
                backgroundCheckForm.bc_convicted_details, backgroundCheckForm.bc_parent_signature_data,
                backgroundCheckForm.bc_parent_signature_date
            ]
        );

        // Insert Acknowledgement Form
        const [acknowledgementResult] = await db.promise().query(
            `INSERT INTO acknowledgement_forms (
                student_id, acknowledgementRead, contractUnderstanding,
                student_ack_signature_data, acknowledgementDate
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                studentId, acknowledgementForm.acknowledgementRead,
                acknowledgementForm.contractUnderstanding,
                acknowledgementForm.student_ack_signature_data,
                acknowledgementForm.acknowledgementDate
            ]
        );

        // Create main enrollment form record linking all forms
        const [enrollmentFormResult] = await db.promise().query(
            `INSERT INTO enrollment_forms (
                student_id, enrollment_agreement_form_id, medical_evaluation_form_id,
                student_id_form_id, uniform_size_form_id, consent_form_id,
                background_check_form_id, acknowledgement_form_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentId, enrollmentAgreementResult.insertId, medicalEvalResult.insertId,
                studentIDResult.insertId, uniformSizeResult.insertId, consentResult.insertId,
                backgroundCheckResult.insertId, acknowledgementResult.insertId, 'Submitted'
            ]
        );

        console.log('Enrollment form data saved successfully');
        console.log('Student ID:', studentId);
        console.log('Enrollment Form ID:', enrollmentFormResult.insertId);

        res.json({
            success: true,
            message: 'Enrollment form submitted successfully',
            studentId: studentId,
            enrollmentFormId: enrollmentFormResult.insertId
        });

    } catch (error) {
        console.error('Error saving enrollment form:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save enrollment form',
            error: error.message
        });
    }
});

// Function to create enrollment tables if they don't exist
async function createEnrollmentTables(db) {
    try {
        console.log('Creating enrollment tables...');
        
        // Create each table separately
        const tables = [
            {
                name: 'enrollment_agreement_forms',
                sql: `CREATE TABLE IF NOT EXISTS enrollment_agreement_forms (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT,
                    enroll_student_name VARCHAR(255),
                    enroll_student_id VARCHAR(255),
                    enroll_address TEXT,
                    enroll_city VARCHAR(100),
                    enroll_state VARCHAR(10),
                    enroll_zip VARCHAR(20),
                    enroll_ec_telephone VARCHAR(50),
                    enroll_phone_h VARCHAR(50),
                    enroll_phone_c VARCHAR(50),
                    enroll_phone_w VARCHAR(50),
                    enroll_email VARCHAR(255),
                    enroll_ssn VARCHAR(20),
                    enroll_admission_date DATE,
                    enroll_program_name VARCHAR(100),
                    enroll_program_description TEXT,
                    enroll_program_start_date DATE,
                    enroll_scheduled_end_date DATE,
                    enroll_type VARCHAR(50),
                    enroll_schedule_type VARCHAR(50),
                    class_days VARCHAR(50),
                    enroll_time_begins TIME,
                    enroll_time_ends TIME,
                    enroll_num_weeks VARCHAR(10),
                    enroll_total_hours VARCHAR(10),
                    aggrement_to_tuition_fees VARCHAR(255),
                    aggrement_to_refund_and_cancellation_policy VARCHAR(255),
                    reg_fee VARCHAR(50),
                    program_cost DECIMAL(10,2),
                    tuition DECIMAL(10,2),
                    books_supplies DECIMAL(10,2),
                    misc_expenses DECIMAL(10,2),
                    other_expenses DECIMAL(10,2),
                    total_cost DECIMAL(10,2),
                    ack_catalog VARCHAR(10),
                    ack_enrollment_agreement VARCHAR(10),
                    ack_termination_policy VARCHAR(10),
                    ack_consumer_info VARCHAR(10),
                    ack_transferability VARCHAR(10),
                    ack_job_placement VARCHAR(10),
                    ack_complaints VARCHAR(10),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )`
            },
            {
                name: 'medical_evaluation_forms',
                sql: `CREATE TABLE IF NOT EXISTS medical_evaluation_forms (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT,
                    program_nursing_assistant VARCHAR(100),
                    med_birth_date DATE,
                    med_gender VARCHAR(20),
                    med_home_phone VARCHAR(50),
                    med_work_phone VARCHAR(50),
                    med_cell_phone VARCHAR(50),
                    em_full_name VARCHAR(255),
                    em_relationship VARCHAR(100),
                    em_address TEXT,
                    em_city VARCHAR(100),
                    state_select VARCHAR(10),
                    em_zip VARCHAR(20),
                    em_phone_home VARCHAR(50),
                    em_phone_work VARCHAR(50),
                    em_phone_cell VARCHAR(50),
                    health_status VARCHAR(50),
                    allergies TEXT,
                    medications_present VARCHAR(10),
                    meds_list TEXT,
                    latex_allergy VARCHAR(10),
                    food_allergy VARCHAR(10),
                    food_list TEXT,
                    pregnant VARCHAR(10),
                    due_date DATE,
                    obgyn VARCHAR(10),
                    lifting_restrictions VARCHAR(10),
                    restrictions_explain TEXT,
                    interfere_standards VARCHAR(10),
                    interfere_explain TEXT,
                    ack_med_eval_info VARCHAR(10),
                    std_mobility BOOLEAN DEFAULT FALSE,
                    std_motor_skills BOOLEAN DEFAULT FALSE,
                    std_visual BOOLEAN DEFAULT FALSE,
                    std_hearing BOOLEAN DEFAULT FALSE,
                    std_tactile BOOLEAN DEFAULT FALSE,
                    std_communication BOOLEAN DEFAULT FALSE,
                    std_acquire_knowledge BOOLEAN DEFAULT FALSE,
                    std_clinical_judgment BOOLEAN DEFAULT FALSE,
                    std_professional_attitude BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )`
            },
            {
                name: 'student_id_forms',
                sql: `CREATE TABLE IF NOT EXISTS student_id_forms (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT,
                    id_lost_fee VARCHAR(10),
                    id_terms_agree VARCHAR(10),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )`
            },
            {
                name: 'uniform_size_forms',
                sql: `CREATE TABLE IF NOT EXISTS uniform_size_forms (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT,
                    uniform_size VARCHAR(10),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )`
            },
            {
                name: 'consent_forms',
                sql: `CREATE TABLE IF NOT EXISTS consent_forms (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT,
                    consent_read_understand VARCHAR(10),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )`
            },
            {
                name: 'background_check_forms',
                sql: `CREATE TABLE IF NOT EXISTS background_check_forms (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT,
                    bc_first_name VARCHAR(100),
                    bc_full_middle_name VARCHAR(100),
                    bc_last_name VARCHAR(100),
                    bc_mailing_address TEXT,
                    bc_city VARCHAR(100),
                    bc_state VARCHAR(100),
                    bc_zip VARCHAR(20),
                    bc_other_names TEXT,
                    bc_telephone VARCHAR(50),
                    bc_states_lived VARCHAR(255),
                    bc_gender VARCHAR(20),
                    bc_race VARCHAR(10),
                    bc_height_ft VARCHAR(10),
                    bc_height_in VARCHAR(10),
                    bc_weight VARCHAR(10),
                    bc_dob DATE,
                    bc_ssn VARCHAR(20),
                    bc_hair_color VARCHAR(50),
                    bc_eye_color VARCHAR(50),
                    bc_place_of_birth VARCHAR(100),
                    bc_abuse VARCHAR(10),
                    bc_abuse_details TEXT,
                    bc_convicted VARCHAR(10),
                    bc_convicted_details TEXT,
                    bc_parent_signature_data LONGTEXT,
                    bc_parent_signature_date DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )`
            },
            {
                name: 'acknowledgement_forms',
                sql: `CREATE TABLE IF NOT EXISTS acknowledgement_forms (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT,
                    acknowledgementRead VARCHAR(10),
                    contractUnderstanding VARCHAR(10),
                    student_ack_signature_data LONGTEXT,
                    acknowledgementDate DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )`
            },
            {
                name: 'enrollment_forms',
                sql: `CREATE TABLE IF NOT EXISTS enrollment_forms (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT,
                    enrollment_agreement_form_id INT,
                    medical_evaluation_form_id INT,
                    student_id_form_id INT,
                    uniform_size_form_id INT,
                    consent_form_id INT,
                    background_check_form_id INT,
                    acknowledgement_form_id INT,
                    status ENUM('Draft', 'Submitted', 'Approved', 'Rejected') DEFAULT 'Draft',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )`
            }
        ];

        // Create each table individually
        for (const table of tables) {
            try {
                await db.promise().query(table.sql);
                console.log(`Table ${table.name} created/verified successfully`);
            } catch (error) {
                console.error(`Error creating table ${table.name}:`, error);
                throw error;
            }
        }

        console.log('All enrollment tables created/verified successfully');
    } catch (error) {
        console.error('Error creating enrollment tables:', error);
        throw error;
    }
}

//create a post route to save student medical supplies form data
router.post('/joomla-medical-supplies-form', async (req, res) => {
    console.log("req.body", req.body);
    
    const db = req.app.locals.db;
    
    try {
        // Check if database connection is alive
        if (!db || db.state === 'disconnected') {
            return res.status(500).json({ 
                success: false, 
                message: 'Database connection not available' 
            });
        }

        const {
            supply_book,
            supply_workbook,
            supply_gait_belt,
            supply_bp_cuff,
            supply_syllabus,
            supply_skills_packet,
            supply_math_packet,
            program,
            course,
            student_name,
            date,
            medsup_signature_data,
            email
        } = req.body;

        // First, find the student by email
        const [existingStudents] = await db.promise().query(
            'SELECT id FROM students WHERE email = ?',
            [email]
        );

        if (existingStudents.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found with this email'
            });
        }

        const studentId = existingStudents[0].id;

        // Create the medical supplies table if it doesn't exist
        await createMedicalSuppliesTable(db);

        // Insert medical supplies form data
        const [medicalSuppliesResult] = await db.promise().query(
            `INSERT INTO medical_supplies_forms (
                student_id, supply_book, supply_workbook, supply_gait_belt,
                supply_bp_cuff, supply_syllabus, supply_skills_packet,
                supply_math_packet, program, course, student_name,
                date, medsup_signature_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentId,
                supply_book === 'true' ? 1 : 0,
                supply_workbook === 'true' ? 1 : 0,
                supply_gait_belt === 'true' ? 1 : 0,
                supply_bp_cuff === 'true' ? 1 : 0,
                supply_syllabus === 'true' ? 1 : 0,
                supply_skills_packet === 'true' ? 1 : 0,
                supply_math_packet === 'true' ? 1 : 0,
                program,
                course,
                student_name,
                date,
                medsup_signature_data
            ]
        );

        console.log('Medical supplies form data saved successfully');
        console.log('Student ID:', studentId);
        console.log('Medical Supplies Form ID:', medicalSuppliesResult.insertId);

        res.json({
            success: true,
            message: 'Medical supplies form submitted successfully',
            studentId: studentId,
            medicalSuppliesFormId: medicalSuppliesResult.insertId
        });

    } catch (error) {
        console.error('Error saving medical supplies form:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save medical supplies form',
            error: error.message
        });
    }
});

// Function to create medical supplies table if it doesn't exist
async function createMedicalSuppliesTable(db) {
    try {
        console.log('Creating medical supplies table...');
        
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS medical_supplies_forms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT,
                supply_book BOOLEAN DEFAULT FALSE,
                supply_workbook BOOLEAN DEFAULT FALSE,
                supply_gait_belt BOOLEAN DEFAULT FALSE,
                supply_bp_cuff BOOLEAN DEFAULT FALSE,
                supply_syllabus BOOLEAN DEFAULT FALSE,
                supply_skills_packet BOOLEAN DEFAULT FALSE,
                supply_math_packet BOOLEAN DEFAULT FALSE,
                program VARCHAR(100),
                course VARCHAR(100),
                student_name VARCHAR(255),
                date DATE,
                medsup_signature_data LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            )
        `;

        await db.promise().query(createTableSql);
        console.log('Medical supplies table created/verified successfully');
        
    } catch (error) {
        console.error('Error creating medical supplies table:', error);
        throw error;
    }
}

module.exports = router;
