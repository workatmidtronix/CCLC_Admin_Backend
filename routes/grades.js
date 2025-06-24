const express = require('express');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');

// ==================== GRADE CATEGORIES ====================

// GET all grade categories
router.get('/categories', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const query = `
      SELECT 
        gc.id,
        gc.category_name,
        gc.weight,
        gc.created_at,
        gc.course_id,
        gc.instructor_id,
        c.course_name as course,
        i.name as instructor
      FROM grade_categories gc
      LEFT JOIN courses c ON gc.course_id = c.id
      LEFT JOIN instructors i ON gc.instructor_id = i.id
      ORDER BY gc.created_at DESC
    `;
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching grade categories:', err);
        return res.status(500).json({ success: false, message: 'Database error while fetching grade categories' });
      }
      res.json({ success: true, categories: results });
    });
  } catch (error) {
    console.error('Server error in GET /grades/categories:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching grade categories' });
  }
});

// POST create new grade category
router.post('/categories', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { course_id, instructor_id, category_name, weight } = req.body;
    if (!course_id || !category_name || weight === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course, category name, and weight are required' 
      });
    }
    const query = `
      INSERT INTO grade_categories (course_id, instructor_id, category_name, weight) 
      VALUES (?, ?, ?, ?)
    `;
    db.query(query, [course_id, instructor_id || null, category_name, weight], (err, result) => {
      if (err) {
        console.error('Error creating grade category:', err);
        return res.status(500).json({ success: false, message: 'Database error while creating grade category' });
      }
      try { logActivity('Grade Category', 'CREATE', `Created grade category: ${category_name}`, req.user?.id); } catch {}
      res.status(201).json({ success: true, message: 'Grade category created successfully', categoryId: result.insertId });
    });
  } catch (error) {
    console.error('Server error in POST /grades/categories:', error);
    res.status(500).json({ success: false, message: 'Server error while creating grade category' });
  }
});

// PUT update grade category
router.put('/categories/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { course_id, instructor_id, category_name, weight } = req.body;
    if (!course_id || !category_name || weight === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course, category name, and weight are required' 
      });
    }
    const query = `
      UPDATE grade_categories 
      SET course_id = ?, instructor_id = ?, category_name = ?, weight = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    db.query(query, [course_id, instructor_id || null, category_name, weight, id], (err, result) => {
      if (err) {
        console.error('Error updating grade category:', err);
        return res.status(500).json({ success: false, message: 'Database error while updating grade category' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Grade category not found' });
      }
      try { logActivity('Grade Category', 'UPDATE', `Updated grade category ID: ${id}`, req.user?.id); } catch {}
      res.json({ success: true, message: 'Grade category updated successfully' });
    });
  } catch (error) {
    console.error('Server error in PUT /grades/categories/:id:', error);
    res.status(500).json({ success: false, message: 'Server error while updating grade category' });
  }
});

// DELETE grade category
router.delete('/categories/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const checkQuery = 'SELECT COUNT(*) as count FROM grade_columns WHERE category_id = ?';
    db.query(checkQuery, [id], (checkErr, checkResult) => {
      if (checkErr) {
        console.error('Error checking grade columns:', checkErr);
        return res.status(500).json({ success: false, message: 'Database error while checking dependencies' });
      }
      if (checkResult[0].count > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete category with associated grade columns. Please delete the columns first.' 
        });
      }
      const deleteQuery = 'DELETE FROM grade_categories WHERE id = ?';
      db.query(deleteQuery, [id], (deleteErr, deleteResult) => {
        if (deleteErr) {
          console.error('Error deleting grade category:', deleteErr);
          return res.status(500).json({ success: false, message: 'Database error while deleting grade category' });
        }
        if (deleteResult.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Grade category not found' });
        }
        try { logActivity('Grade Category', 'DELETE', `Deleted grade category ID: ${id}`, req.user?.id); } catch {}
        res.json({ success: true, message: 'Grade category deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Server error in DELETE /grades/categories/:id:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting grade category' });
  }
});

// ==================== GRADE COLUMNS ====================

// GET all grade columns
router.get('/columns', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const query = `
      SELECT 
        gc.id,
        gc.column_name,
        gc.max_points,
        gc.include_in_calculation,
        gc.created_at,
        gc.course_id,
        gc.category_id,
        c.course_name as course,
        gcat.category_name as category
      FROM grade_columns gc
      LEFT JOIN courses c ON gc.course_id = c.id
      LEFT JOIN grade_categories gcat ON gc.category_id = gcat.id
      ORDER BY gc.created_at DESC
    `;
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching grade columns:', err);
        return res.status(500).json({ success: false, message: 'Database error while fetching grade columns' });
      }
      res.json({ success: true, columns: results });
    });
  } catch (error) {
    console.error('Server error in GET /grades/columns:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching grade columns' });
  }
});

// POST create new grade column
router.post('/columns', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { course_id, category_id, column_name, max_points, include_in_calculation } = req.body;
    if (!course_id || !category_id || !column_name || max_points === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course, category, column name, and max points are required' 
      });
    }
    const query = `
      INSERT INTO grade_columns (course_id, category_id, column_name, max_points, include_in_calculation) 
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(query, [course_id, category_id, column_name, max_points, include_in_calculation || true], (err, result) => {
      if (err) {
        console.error('Error creating grade column:', err);
        return res.status(500).json({ success: false, message: 'Database error while creating grade column' });
      }
      try { logActivity('Grade Column', 'CREATE', `Created grade column: ${column_name}`, req.user?.id); } catch {}
      res.status(201).json({ success: true, message: 'Grade column created successfully', columnId: result.insertId });
    });
  } catch (error) {
    console.error('Server error in POST /grades/columns:', error);
    res.status(500).json({ success: false, message: 'Server error while creating grade column' });
  }
});

// PUT update grade column
router.put('/columns/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { course_id, category_id, column_name, max_points, include_in_calculation } = req.body;
    if (!course_id || !category_id || !column_name || max_points === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course, category, column name, and max points are required' 
      });
    }
    const query = `
      UPDATE grade_columns 
      SET course_id = ?, category_id = ?, column_name = ?, max_points = ?, include_in_calculation = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    db.query(query, [course_id, category_id, column_name, max_points, include_in_calculation || true, id], (err, result) => {
      if (err) {
        console.error('Error updating grade column:', err);
        return res.status(500).json({ success: false, message: 'Database error while updating grade column' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Grade column not found' });
      }
      try { logActivity('Grade Column', 'UPDATE', `Updated grade column ID: ${id}`, req.user?.id); } catch {}
      res.json({ success: true, message: 'Grade column updated successfully' });
    });
  } catch (error) {
    console.error('Server error in PUT /grades/columns/:id:', error);
    res.status(500).json({ success: false, message: 'Server error while updating grade column' });
  }
});

// DELETE grade column
router.delete('/columns/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const deleteQuery = 'DELETE FROM grade_columns WHERE id = ?';
    db.query(deleteQuery, [id], (deleteErr, deleteResult) => {
      if (deleteErr) {
        console.error('Error deleting grade column:', deleteErr);
        return res.status(500).json({ success: false, message: 'Database error while deleting grade column' });
      }
      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Grade column not found' });
      }
      try { logActivity('Grade Column', 'DELETE', `Deleted grade column ID: ${id}`, req.user?.id); } catch {}
      res.json({ success: true, message: 'Grade column deleted successfully' });
    });
  } catch (error) {
    console.error('Server error in DELETE /grades/columns/:id:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting grade column' });
  }
});

// ==================== HELPER ENDPOINTS ====================

// GET courses for dropdown
router.get('/courses', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const query = 'SELECT id, course_name FROM courses WHERE status = "Active" ORDER BY course_name';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching courses:', err);
        return res.status(500).json({ success: false, message: 'Database error while fetching courses' });
      }
      res.json({ success: true, courses: results });
    });
  } catch (error) {
    console.error('Server error in GET /grades/courses:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching courses' });
  }
});

// GET instructors for dropdown
router.get('/instructors', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const query = 'SELECT id, name FROM instructors WHERE status = "Active" ORDER BY name';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching instructors:', err);
        return res.status(500).json({ success: false, message: 'Database error while fetching instructors' });
      }
      res.json({ success: true, instructors: results });
    });
  } catch (error) {
    console.error('Server error in GET /grades/instructors:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching instructors' });
  }
});

// GET categories for dropdown
router.get('/categories-dropdown', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const query = 'SELECT id, category_name FROM grade_categories ORDER BY category_name';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).json({ success: false, message: 'Database error while fetching categories' });
      }
      res.json({ success: true, categories: results });
    });
  } catch (error) {
    console.error('Server error in GET /grades/categories-dropdown:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching categories' });
  }
});

module.exports = router;