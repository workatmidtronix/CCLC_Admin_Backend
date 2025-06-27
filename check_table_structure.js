const mysql = require('mysql2');

const db = mysql.createConnection({
    host: "162.240.35.90",
    user: "cclcusa_cclc",
    password: "CCLC@IP840!",
    database: "cclcusa_db",
    port: 3306,
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    
    console.log('Connected to database');
    
    // Check table structure
    db.query('DESCRIBE students', (err, results) => {
        if (err) {
            console.error('Error describing table:', err);
            return;
        }
        
        console.log('\n=== CURRENT STUDENTS TABLE STRUCTURE ===');
        results.forEach(row => {
            console.log(`${row.Field} - ${row.Type} - ${row.Null} - ${row.Key} - ${row.Default}`);
        });
        console.log('==========================================\n');
        
        db.end();
    });
}); 