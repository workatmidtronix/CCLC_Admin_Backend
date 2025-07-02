const mysql = require('mysql2');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "162.240.35.90",
  user: process.env.DB_USER || "cclcusa_cclc", 
  password: process.env.DB_PASSWORD || "CCLC@IP840!",
  database: process.env.DB_NAME || "cclcusa_db",
  port: process.env.DB_PORT || 3306,
};

async function killConnections() {
  let connection;
  
  try {
    console.log('Connecting to database to kill existing connections...');
    
    // Create a direct connection (not pool) to kill other connections
    connection = await mysql.createConnection(dbConfig);
    
    // Get current connections
    const [connections] = await connection.query(`
      SELECT id, user, host, db, command, time, state 
      FROM information_schema.processlist 
      WHERE user = 'cclcusa_cclc' AND command != 'Sleep'
    `);
    
    console.log(`Found ${connections.length} active connections for user cclcusa_cclc`);
    
    // Kill all connections except the current one
    for (const conn of connections) {
      if (conn.id !== connection.threadId) {
        try {
          await connection.query(`KILL ${conn.id}`);
          console.log(`✓ Killed connection ${conn.id}`);
        } catch (error) {
          console.log(`⚠ Could not kill connection ${conn.id}:`, error.message);
        }
      }
    }
    
    console.log('✅ Connection cleanup completed');
    
  } catch (error) {
    console.error('❌ Error killing connections:', error.message);
  } finally {
    if (connection) {
      connection.end();
    }
  }
}

// Run if called directly
if (require.main === module) {
  killConnections();
}

module.exports = { killConnections }; 