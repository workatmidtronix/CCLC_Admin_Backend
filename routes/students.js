// Required imports for file handling and hashing
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For password hashing
const { body, validationResult } = require('express-validator'); // For validation
const fs = require('fs'); // For file system operations
const path = require('path'); // For path operations
const { handleStudentFileUpload, getRelativePath, getAbsolutePath } = require('../utils/fileUpload');

// Function to create the 'students' table if it doesn't exist
const createStudentsTable = (db) => {
  return new Promise((resolve, reject) => {
    const createTableSql = `
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                login_id VARCHAR(255)  NOT NULL,
                -- IMPORTANT: If students use this password for login, it MUST be hashed!
                -- Add a VARCHAR(255) type for the password field if you include it.
                password VARCHAR(255), 
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE,
                phone VARCHAR(20),
                date_of_birth DATE,
                address_line1 VARCHAR(255),
                city VARCHAR(100),
                state VARCHAR(100),
                postal_code VARCHAR(20),
                country VARCHAR(100),
                registration_number VARCHAR(255) UNIQUE,
                date_of_joining DATE,
                gender VARCHAR(50),
                religion VARCHAR(100),
                nationality VARCHAR(100),
                photo VARCHAR(255), -- Store URL/path to photo
                course VARCHAR(255),
                department VARCHAR(255),
                student_notes TEXT,
                session VARCHAR(100),
                drivers_license VARCHAR(255),
                dl_upload VARCHAR(255), -- Store URL/path to DL upload
                student_pcp_info TEXT,
                student_pcp_phone VARCHAR(20),
                status VARCHAR(50),
                semester VARCHAR(50),
                social_security_number VARCHAR(255),
                social_security_upload VARCHAR(255), -- Store URL/path to SSN upload
                emergency_contact_info TEXT,
                emergency_contact_phone VARCHAR(20),
                other_emergency_contact TEXT,
                caseworker_name VARCHAR(255),
                workforce_center VARCHAR(255),
                tara_ita_packet_upload VARCHAR(255), -- Store URL/path to upload
                tara_ita_completion_date DATE,
                voucher_dates TEXT, -- Changed to TEXT to store path or list of dates
                info_session_date DATE,
                notes TEXT,
                course_pref1 VARCHAR(255),
                days_pref1 VARCHAR(255),
                location_pref1 VARCHAR(255),
                course_pref2 VARCHAR(255),
                days_pref2 VARCHAR(255),
                location_pref2 VARCHAR(255),
                attended_info_session BOOLEAN,
                info_session_location VARCHAR(255),
                additional_comments TEXT,
                signature TEXT, -- Changed from VARCHAR(255) to TEXT to store Base64 string
                name_capitalization VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
    db.query(createTableSql, (err) => {
      if (err) {
        console.error("Error creating students table:", err);
        return reject(new Error("Failed to create students table."));
      }
      resolve();
    });
  });
};

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
router.post('/', handleStudentFileUpload(), validateStudent, async (req, res) => {
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
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const db = req.app.locals.db;
    await createStudentsTable(db);

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

    console.log("Login ID storing as student", loginId);

    const photoPath = req.files && req.files['photo'] && req.files['photo'][0]
      ? getRelativePath('student', email, req.files['photo'][0].filename)
      : null;

    const dlUploadPath = req.files && req.files['dlUpload'] && req.files['dlUpload'][0]
      ? getRelativePath('student', email, req.files['dlUpload'][0].filename)
      : null;

    const ssnUploadPath = req.files && req.files['socialSecurityUpload'] && req.files['socialSecurityUpload'][0]
      ? getRelativePath('student', email, req.files['socialSecurityUpload'][0].filename)
      : null;

    const taraItaPath = req.files && req.files['taraItaPacketUpload'] && req.files['taraItaPacketUpload'][0]
      ? getRelativePath('student', email, req.files['taraItaPacketUpload'][0].filename)
      : null;

    const voucherDatesPath = req.files && req.files['voucherDates'] && req.files['voucherDates'][0]
      ? getRelativePath('student', email, req.files['voucherDates'][0].filename)
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

      // Email is unique, proceed with registration
      try {
        // Hash password


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
          loginId, password, firstName, lastName, email, phone,
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

        // Format the response
        const student = existingStudent[0];
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
          db.query(documentsQuery, [id], (documentsErr, documentsResults) => {
            db.query(itaAttendanceQuery, [id], (itaErr, itaResults) => {
              db.query(previousCoursesQuery, [id], (prevErr, prevResults) => {

                // Check for errors (but don't fail if some tables don't exist)
                const errors = [];
                if (workforceErr) errors.push('workforce');
                if (attendanceErr && !attendanceErr.message.includes("doesn't exist")) errors.push('attendance');
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

// POST request to save enrollment forms
router.post('/enrollment-forms', handleStudentFileUpload(), async (req, res) => {
  try {
    console.log("Enrollment form data received:", req.body);

    const db = req.app.locals.db;
    const formData = req.body;

    // Check if student with this email already exists
    const [existingStudents] = await db.promise().query(
      'SELECT id FROM students WHERE email = ?',
      [formData.enroll_email]
    );

    if (existingStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student is not registered. Please register as a student first before submitting enrollment forms.'
      });
    }

    const studentId = existingStudents[0].id;
    console.log(`Found existing student with ID: ${studentId}`);

    // Save enrollment form data to enrollment_forms table
    const enrollmentData = {
      student_id: studentId,
      form_data: JSON.stringify(formData),
      created_at: new Date()
    };

    // Insert enrollment form data
    const [enrollmentResult] = await db.promise().query(
      'INSERT INTO enrollment_forms SET ?',
      enrollmentData
    );

    console.log(`Enrollment form saved with ID: ${enrollmentResult.insertId}`);

    res.status(201).json({
      success: true,
      message: 'Enrollment form submitted successfully',
      studentId: studentId,
      enrollmentId: enrollmentResult.insertId
    });

  } catch (error) {
    console.error('Error saving enrollment form:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving enrollment form',
      error: error.message
    });
  }
});

// GET request to retrieve student enrollment forms by email
router.get('/enrollment-forms/:email', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { email } = req.params;

    // First check if student with this email exists
    const [existingStudents] = await db.promise().query(
      'SELECT id, first_name, last_name, email FROM students WHERE email = ?',
      [email]
    );

    if (existingStudents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with this email address.'
      });
    }

    const student = existingStudents[0];

    // Get all enrollment forms for this student
    const [enrollmentForms] = await db.promise().query(
      'SELECT id, form_data, created_at FROM enrollment_forms WHERE student_id = ? ORDER BY created_at DESC',
      [student.id]
    );

    // Parse the JSON form_data for each enrollment form
    const formattedEnrollmentForms = enrollmentForms.map(form => ({
      id: form.id,
      formData: JSON.parse(form.form_data),
      submittedAt: form.created_at
    }));

    // Merge all fields from the latest enrollment form into the student object (if exists)
    let mergedStudent = {
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email
    };
    if (formattedEnrollmentForms.length > 0) {
      mergedStudent = {
        ...mergedStudent,
        ...formattedEnrollmentForms[0].formData // add all fields from latest form
      };
    }
    console.log("Enrollment forms retrieved successfully", {
      success: true,
      message: 'Enrollment forms retrieved successfully',
      student: mergedStudent,
      enrollmentForms: formattedEnrollmentForms,
      totalForms: formattedEnrollmentForms.length
    });
    res.json({
      success: true,
      message: 'Enrollment forms retrieved successfully',
      student: mergedStudent,
      enrollmentForms: formattedEnrollmentForms,
      totalForms: formattedEnrollmentForms.length
    });

  } catch (error) {
    console.error('Error retrieving enrollment forms:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving enrollment forms',
      error: error.message
    });
  }
});

// Student login route
router.post('/student-login', async (req, res) => {
  console.log("Student login request:", req.body);

  const db = req.app.locals.db;

  try {
    // Check if database connection is alive
    if (!db || db.state === 'disconnected') {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    const { email, loginId, password } = req.body;

    // Validate required fields
    if (!email || !loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, login ID, and password are required'
      });
    }

    // First, check if email exists
    const [emailCheck] = await db.promise().query(
      'SELECT id, email FROM students WHERE email = ?',
      [email]
    );

    if (emailCheck.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'The provided email address is not associated with any registered student.'
      });
    }
    console.log("emailCheck", emailCheck);
    // If email exists, check login ID and password
    const [studentCheck] = await db.promise().query(
      'SELECT id, login_id, password, first_name, last_name, email, course, status FROM students WHERE email = ? AND login_id = ?',
      [email, loginId]
    );
    console.log("studentCheck", studentCheck);
    if (studentCheck.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login ID. Please check your credentials.'
      });
    }

    const student = studentCheck[0];
    console.log("student", student.status);
    // Check if student is active
    if (student.status !== 'Active' && student.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Your account is not active. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = password == student.password;

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please check your credentials.'
      });
    }

    // Login successful
    console.log('Student login successful:', student.email);

    res.json({
      success: true,
      message: 'Login successful! Now you can fill out the form.',
      student: {
        id: student.id,
        firstName: student.first_name,
        lastName: student.last_name,
        email: student.email,
        course: student.course,
        status: student.status
      }
    });

  } catch (error) {
    console.error('Error during student login:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.',
      error: error.message
    });
  }
});

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