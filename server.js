const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://localhost:3000',
        'https://127.0.0.1:3000',
        'https://cclcusa.org',
        'https://www.cclcusa.org',
        'http://cclcusa.org',
        'http://www.cclcusa.org',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
console.log('Connecting to database with env:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

const db = mysql.createConnection({
    // host: process.env.DB_HOST,
    // user: process.env.DB_USER,
    // password: process.env.DB_PASSWORD,
    // database: process.env.DB_NAME,
    // port: process.env.DB_PORT,

    // host: "localhost",
    // user: "root",
    // password: "P@ssword_1234",
    // database: "cclc",
    // port: 3306,

    host: "162.240.35.90",
    user: "cclcusa_cclc",
    password: "CCLC@IP840!",
    database: "cclcusa_db",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    // Key settings for handling timeouts
    idleTimeout: 300000, // 5 minutes
    maxIdle: 10,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});



db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        console.log('Server will continue to run without database connection');
    } else {
        console.log('Connected to MySQL database');
    }
});

// Handle database connection errors and reconnection
db.on('error', (err) => {
    console.error('Database connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Database connection was lost. Attempting to reconnect...');
        setTimeout(() => {
            db.connect((reconnectErr) => {
                if (reconnectErr) {
                    console.error('Failed to reconnect to database:', reconnectErr);
                } else {
                    console.log('Successfully reconnected to database');
                }
            });
        }, 2000);
    } else {
        console.error('Database error:', err);
    }
});

// Make db available to routes
app.locals.db = db;

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/students', require('./routes/students'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/attendance-reports', require('./routes/attendanceReports'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/instructors', require('./routes/instructors'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/ita-master', require('./routes/itaMaster'));
app.use('/api/ita-attendance-signed', require('./routes/itaAttendanceSigned'));
app.use('/api/signed-ita-attendance', require('./routes/signedItaAttendance'));
app.use('/api/midterm-reports', require('./routes/midtermReports'));
app.use('/api/student-progress-reports', require('./routes/studentProgressReports'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start HTTP server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Access your API at: ${process.env.NODE_ENV === 'production' ? 'https://your-app-name.onrender.com' : `http://localhost:${PORT}`}`);
}); 