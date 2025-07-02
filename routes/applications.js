const express = require('express');
const router = express.Router();
const { handleStudentFileUpload } = require('../utils/fileUpload');

// Get all applications
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { search } = req.query;
    
    let query = `
      SELECT 
        id,
        first_name,
        last_name,
        contact_number,
        email_address,
        date_of_birth,
        date_of_joining,
        address,
        state_province,
        gender,
        religion,
        nationality,
        course,
        department,
        student_notes,
        semester,
        session,
        social_security_number,
        driver_license_number,
        student_pcp_info,
        student_pcp_phone,
        emergency_contact_info,
        emergency_contact_phone,
        other_emergency_contact,
        course_interest_1,
        days_preferred_1,
        location_preference_1,
        course_interest_2,
        days_preferred_2,
        location_preference_2,
        attended_info_session,
        filled_out_where,
        additional_comments,
        signature,
        caseworker_name,
        workforce_center,
        tara_ita_packet_date,
        info_session_date,
        photo_path,
        social_security_path,
        dl_path,
        tara_ita_path,
        voucher_dates_path,
        status,
        created_at,
        updated_at
      FROM applications
    `;
    
    const queryParams = [];
    
    // Add search functionality
    if (search) {
      query += `
        WHERE 
          first_name LIKE ? OR 
          last_name LIKE ? OR 
          email_address LIKE ? OR 
          contact_number LIKE ?
      `;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching applications:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching applications',
          error: err.message 
        });
      }
      
      res.json({ 
        success: true, 
        applications: results 
      });
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching applications' 
    });
  }
});

// Get application by ID
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    const query = `
      SELECT * FROM applications WHERE id = ?
    `;
    
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error fetching application:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching application',
          error: err.message 
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Application not found' 
        });
      }
      
      res.json({ 
        success: true, 
        application: results[0] 
      });
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching application' 
    });
  }
});

// Create a new application
router.post('/', handleStudentFileUpload(), async (req, res) => {
  console.log("=== APPLICATION CREATION STARTED ===");
  console.log("Creating application");
  console.log("Body:", req.body);
  console.log("Files:", req.files);
  
  try {
    const db = req.app.locals.db;
    
    // Map frontend field names to database field names
    const {
      firstName,           // frontend: firstName -> database: first_name
      lastName,            // frontend: lastName -> database: last_name
      phone,               // frontend: phone -> database: contact_number
      email,               // frontend: email -> database: email_address
      dateOfJoining,       // frontend: dateOfJoining -> database: date_of_joining
      dateOfBirth,         // frontend: dateOfBirth -> database: date_of_birth
      addressLine1,        // frontend: addressLine1 -> database: address
      city,                // frontend: city -> database: state_province
      state,               // frontend: state -> database: state_province
      gender,              // frontend: gender -> database: gender
      postalCode,          // frontend: postalCode -> database: address
      country,             // frontend: country -> database: nationality
      religion,            // frontend: religion -> database: religion
      nationality,         // frontend: nationality -> database: nationality
      course,              // frontend: course -> database: course
      department,          // frontend: department -> database: department
      studentNotes,        // frontend: studentNotes -> database: student_notes
      semester,            // frontend: semester -> database: semester
      session,             // frontend: session -> database: session
      socialSecurityNumber, // frontend: socialSecurityNumber -> database: social_security_number
      driversLicense,      // frontend: driversLicense -> database: driver_license_number
      studentPcpInfo,      // frontend: studentPcpInfo -> database: student_pcp_info
      studentPcpPhone,     // frontend: studentPcpPhone -> database: student_pcp_phone
      emergencyContactInfo, // frontend: emergencyContactInfo -> database: emergency_contact_info
      emergencyContactPhone, // frontend: emergencyContactPhone -> database: emergency_contact_phone
      otherEmergencyContact, // frontend: otherEmergencyContact -> database: other_emergency_contact
               // frontend: status -> database: status
      coursePref1,         // frontend: coursePref1 -> database: course_interest_1
      daysPref1,           // frontend: daysPref1 -> database: days_preferred_1
      locationPref1,       // frontend: locationPref1 -> database: location_preference_1
      coursePref2,         // frontend: coursePref2 -> database: course_interest_2
      daysPref2,           // frontend: daysPref2 -> database: days_preferred_2
      locationPref2,       // frontend: locationPref2 -> database: location_preference_2
      attendedInfoSessionValue, // frontend: attendedInfoSessionValue -> database: attended_info_session
      infoSessionLocation, // frontend: infoSessionLocation -> database: filled_out_where
      additionalComments,  // frontend: additionalComments -> database: additional_comments
      signature,           // frontend: signature -> database: signature
      caseworkerName,      // frontend: caseworkerName -> database: caseworker_name
      workforceCenter,     // frontend: workforceCenter -> database: workforce_center
      taraItaCompletionDate, // frontend: taraItaCompletionDate -> database: tara_ita_packet_date
      infoSessionDate,     // frontend: infoSessionDate -> database: info_session_date
      loginId,             // frontend: loginId -> database: login_id
      password             // frontend: password -> database: password
    } = req.body;

    console.log("=== EXTRACTED FIELDS ===");
    console.log("firstName:", firstName);
    console.log("lastName:", lastName);
    console.log("phone:", phone);
    console.log("email:", email);
    console.log("course:", course);
    console.log("session:", session);

    // Validate required fields
    console.log("=== VALIDATING REQUIRED FIELDS ===");
    if (!firstName || !lastName || !email || !phone) {
      console.log("❌ Missing required fields");
      console.log("firstName:", !!firstName);
      console.log("lastName:", !!lastName);
      console.log("email:", !!email);
      console.log("phone:", !!phone);
      
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, phone'
      });
    }
    console.log("✅ Required fields validation passed");

    // Handle file uploads
    console.log("=== HANDLING FILE UPLOADS ===");
    const photoPath = req.files?.photo ? req.files.photo[0].path : null;
    const socialSecurityPath = req.files?.socialSecurityUpload ? req.files.socialSecurityUpload[0].path : null;
    const dlPath = req.files?.dlUpload ? req.files.dlUpload[0].path : null;
    const taraItaPath = req.files?.taraItaPacketUpload ? req.files.taraItaPacketUpload[0].path : null;
    const voucherDatesPath = req.files?.voucherDates ? req.files.voucherDates[0].path : null;

    console.log("photoPath:", photoPath);
    console.log("socialSecurityPath:", socialSecurityPath);
    console.log("dlPath:", dlPath);
    console.log("taraItaPath:", taraItaPath);
    console.log("voucherDatesPath:", voucherDatesPath);

    // Combine address fields
    const fullAddress = [addressLine1, city, state, postalCode, country].filter(Boolean).join(', ');

    console.log("=== PREPARING DATABASE QUERY ===");
    const query = `
      INSERT INTO applications (
        first_name, last_name, contact_number, email_address, date_of_joining,
        date_of_birth, address, state_province, gender, religion, nationality,
        course, department, student_notes, semester, session, social_security_number,
        driver_license_number, student_pcp_info, student_pcp_phone, emergency_contact_info,
        emergency_contact_phone, other_emergency_contact, status, course_interest_1,
        days_preferred_1, location_preference_1, course_interest_2, days_preferred_2,
        location_preference_2, attended_info_session, filled_out_where, additional_comments,
        signature, caseworker_name, workforce_center, tara_ita_packet_date,
        info_session_date, login_id, password, photo_path, social_security_path,
        dl_path, tara_ita_path, voucher_dates_path, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const values = [
      firstName,                    // first_name
      lastName,                     // last_name
      phone,                        // contact_number
      email,                        // email_address
      dateOfJoining || null,        // date_of_joining
      dateOfBirth || null,          // date_of_birth
      fullAddress || null,          // address
      state || null,                // state_province
      gender || null,               // gender
      religion || null,             // religion
      nationality || null,          // nationality
      course || null,               // course
      department || null,           // department
      studentNotes || null,         // student_notes
      semester || null,             // semester
      session || null,              // session
      socialSecurityNumber || null, // social_security_number
      driversLicense || null,       // driver_license_number
      studentPcpInfo || null,       // student_pcp_info
      studentPcpPhone || null,      // student_pcp_phone
      emergencyContactInfo || null, // emergency_contact_info
      emergencyContactPhone || null, // emergency_contact_phone
      otherEmergencyContact || null, // other_emergency_contact
      'inactive',           // status
      coursePref1 || null,          // course_interest_1
      daysPref1 || null,            // days_preferred_1
      locationPref1 || null,        // location_preference_1
      coursePref2 || null,          // course_interest_2
      daysPref2 || null,            // days_preferred_2
      locationPref2 || null,        // location_preference_2
      attendedInfoSessionValue || null, // attended_info_session
      infoSessionLocation || null,  // filled_out_where
      additionalComments || null,   // additional_comments
      signature || null,            // signature
      caseworkerName || null,       // caseworker_name
      workforceCenter || null,      // workforce_center
      taraItaCompletionDate || null, // tara_ita_packet_date
      infoSessionDate || null,      // info_session_date
      loginId || null,              // login_id
      password || null,             // password
      photoPath,                    // photo_path
      socialSecurityPath,           // social_security_path
      dlPath,                       // dl_path
      taraItaPath,                  // tara_ita_path
      voucherDatesPath              // voucher_dates_path
    ];

    console.log("=== EXECUTING DATABASE QUERY ===");
    console.log("Query:", query);
    console.log("Values count:", values.length);
    console.log("First few values:", values.slice(0, 5));

    db.query(query, values, (err, result) => {
      if (err) {
        console.error("❌ Database error:", err);
        console.error("Error message:", err.message);
        console.error("Error code:", err.code);
        return res.status(500).json({
          success: false,
          message: 'Error creating application',
          error: err.message
        });
      }

      console.log("✅ Application created successfully");
      console.log("Insert ID:", result.insertId);
      console.log("=== APPLICATION CREATION COMPLETED ===");

      res.status(201).json({
        success: true,
        message: 'Application created successfully',
        applicationId: result.insertId
      });
    });
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while creating application'
    });
  }
});

// Update an application
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone_number,
      days_preferred_1,
      days_preferred_2,
      status,
      notes
    } = req.body;

    // Check if application exists
    const [existingApplication] = await db.promise().query(
      'SELECT * FROM applications WHERE id = ?',
      [id]
    );

    if (existingApplication.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const query = `
      UPDATE applications SET
        first_name = ?, last_name = ?, email = ?, phone_number = ?,
        days_preferred_1 = ?, days_preferred_2 = ?, status = ?, notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      first_name,
      last_name,
      email,
      phone_number,
      days_preferred_1 || '',
      days_preferred_2 || '',
      status || 'Pending',
      notes || '',
      id
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error updating application:', err);
        return res.status(500).json({
          success: false,
          message: 'Error updating application',
          error: err.message
        });
      }

      res.json({
        success: true,
        message: 'Application updated successfully'
      });
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating application'
    });
  }
});

// Delete an application
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    // Check if application exists
    const [existingApplication] = await db.promise().query(
      'SELECT * FROM applications WHERE id = ?',
      [id]
    );

    if (existingApplication.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Delete the application
    const [result] = await db.promise().query(
      'DELETE FROM applications WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting application'
    });
  }
});

// Update application status
router.patch('/:id/status', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Pending', 'Approved', 'Rejected', 'Waitlisted'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: Pending, Approved, Rejected, Waitlisted'
      });
    }

    // Check if application exists
    const [existingApplication] = await db.promise().query(
      'SELECT * FROM applications WHERE id = ?',
      [id]
    );

    if (existingApplication.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const query = `
      UPDATE applications SET
        status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.query(query, [status, id], (err, result) => {
      if (err) {
        console.error('Error updating application status:', err);
        return res.status(500).json({
          success: false,
          message: 'Error updating application status',
          error: err.message
        });
      }

      res.json({
        success: true,
        message: 'Application status updated successfully'
      });
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating application status'
    });
  }
});



module.exports = router; 