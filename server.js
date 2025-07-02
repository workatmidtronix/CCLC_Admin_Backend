const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

const { pool, promise } = require('./utils/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Parse CORS origins from environment variable
const corsOrigins = [
    'http://localhost:3000', 
    'http://127.0.0.1:3000', 
    'https://cclcusa.org',
    'https://www.cclcusa.org',
    'https://www.cclcusa.org/'
];

// Middleware
app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make database pool and promise interface available to routes
app.locals.db = pool;
app.locals.dbPromise = promise;

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/students', require('./routes/students'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/instructors', require('./routes/instructors'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/calendar', require('./routes/calendar'));

// Add this route to monitor database connections
app.get('/api/health/db', (req, res) => {
  const pool = req.app.locals.db;
  res.json({
    pool: {
      threadId: pool.threadId,
      connectionLimit: pool.config.connectionLimit,
      queueLimit: pool.config.queueLimit,
      acquireTimeout: pool.config.acquireTimeout,
      timeout: pool.config.timeout
    },
    status: 'Database pool is running'
  });
});

// Default route
app.get('/', (req, res) => {
    res.json({ message: 'CCLC Admin Panel API Server' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
}); 