const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
// const config = require('../config');

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', [
  // Validation middleware for request body fields
  body('loginID').notEmpty().withMessage('Login ID is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'staff']).withMessage('Invalid role'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Destructure request body
    const { loginID, password, role, firstName, lastName, email } = req.body;
    // Access the database promise interface from app locals
    const db = req.app.locals.db;

    // Check if user already exists based on loginID or email
    const checkSql = "SELECT id FROM users WHERE login_id = ? OR email = ?";
    const [checkResult] = await db.query(checkSql, [loginID, email]);

    // If a user with the given loginID or email is found, return an error
    if (checkResult.length > 0) {
      return res.status(400).json({ message: "User with this login ID or email already exists" });
    }

    // Store password as plain text (no hashing)
    const insertSql = `
      INSERT INTO users (login_id, password, role, first_name, last_name, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [insertResult] = await db.query(insertSql, [loginID, password, role, firstName, lastName, email]);

    // Prepare JWT payload with user details
    const payload = {
      user: {
        id: insertResult.insertId,
        loginID,
        role
      }
    };

    // Sign the JWT token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // Respond with success message, token, and user details
    res.json({
      success: true,
      token,
      user: {
        id: insertResult.insertId,
        loginID,
        role,
        firstName,
        lastName,
        email
      }
    });

  } catch (error) {
    console.error("Server error during signup:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user
// @access  Public
router.post('/login', [
  body('loginID').notEmpty().withMessage('Login ID is required'),
  body('password').exists().withMessage('Password is required'),
  body('role').isIn(['admin', 'staff']).withMessage('Invalid role')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { loginID, password, role } = req.body;
  console.log(req.body)
  const db = req.app.locals.db;
  
  // Get user from database using callback style
  const sql = "SELECT * FROM users WHERE login_id = ? AND role = ?";
  db.query(sql, [loginID, role], (err, results) => {
    if (err) {
      console.error("Database error during login:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = results[0];

    // Compare passwords directly (plain text)
    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        loginID: user.login_id,
        role: user.role
      }
    };

    // Sign token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        loginID: user.login_id,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email
      }
    });
  });
});

// @route   POST /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.post('/verify', (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({
      success: true,
      admin: decoded.admin
    });

  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
});

module.exports = router; 