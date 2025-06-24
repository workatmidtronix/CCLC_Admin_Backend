const mysql = require('mysql2');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "P@ssword_1234",
    database: "cclc",
    port: 3306,
});

console.log('Checking table structures...');

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    } else {
        console.log('Connected to MySQL database successfully');
        
        // Check instructors table structure
        db.query('DESCRIBE instructors', (err, results) => {
            if (err) {
                console.error('Error describing instructors:', err);
            } else {
                console.log('Instructors table structure:', results);
            }
            
            // Check if instructors table has data
            db.query('SELECT * FROM instructors LIMIT 3', (err, results) => {
                if (err) {
                    console.error('Error querying instructors:', err);
                } else {
                    console.log('Instructors data:', results);
                }
                db.end();
            });
        });
    }
}); 