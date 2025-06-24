const express = require('express');
const router = express.Router();

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
        email,
        phone_number,
        days_preferred_1,
        days_preferred_2,
        added_time,
        status,
        notes,
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
          email LIKE ? OR 
          phone_number LIKE ?
      `;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY added_time DESC, created_at DESC';
    
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
router.post('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
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

    // Validate required fields
    if (!first_name || !last_name || !email || !phone_number) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: first_name, last_name, email, phone_number'
      });
    }

    const query = `
      INSERT INTO applications (
        first_name, last_name, email, phone_number, days_preferred_1,
        days_preferred_2, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      first_name,
      last_name,
      email,
      phone_number,
      days_preferred_1 || '',
      days_preferred_2 || '',
      status || 'Pending',
      notes || ''
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error creating application:', err);
        return res.status(500).json({
          success: false,
          message: 'Error creating application',
          error: err.message
        });
      }

      res.status(201).json({
        success: true,
        message: 'Application created successfully',
        applicationId: result.insertId
      });
    });
  } catch (error) {
    console.error('Error creating application:', error);
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