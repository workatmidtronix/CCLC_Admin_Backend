const mysql = require('mysql2');

// Database configuration using environment variables with fallbacks
const dbConfig = {
  host: process.env.DB_HOST || "162.240.35.90",
  user: process.env.DB_USER || "cclcusa_cclc", 
  password: process.env.DB_PASSWORD || "CCLC@IP840!",
  database: process.env.DB_NAME || "cclcusa_db",
  port: process.env.DB_PORT || 3306,
};

console.log(dbConfig);

// Create connection pool for better performance and reliability
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10, // Increased from 5
  queueLimit: 10, // Increased from 5
});

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database successfully');
    connection.release();
  }
});

// Add connection pool monitoring
pool.on('connection', (connection) => {
  console.log('New connection established to database');
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Add connection release monitoring
pool.on('release', (connection) => {
  console.log('Connection released back to pool');
});

// Export both pool and promise interface for different use cases
module.exports = {
  pool,
  promise: pool.promise(),
  // Helper function for getting a connection (useful for transactions)
  getConnection: () => pool.getConnection(),
  // Helper function for running migrations/setup scripts
  query: (sql, params) => pool.promise().query(sql, params)
}; 