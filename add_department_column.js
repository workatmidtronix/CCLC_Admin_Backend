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
    
    // First, get current table structure
    db.query('DESCRIBE students', (err, results) => {
        if (err) {
            console.error('Error describing table:', err);
            return;
        }
        
        const existingColumns = results.map(row => row.Field);
        console.log('Existing columns:', existingColumns);
        
        // Define columns to add
        const columnsToAdd = [
            { name: 'department', type: 'VARCHAR(255)' },
            { name: 'address_line1', type: 'VARCHAR(255)' },
            { name: 'city', type: 'VARCHAR(100)' },
            { name: 'state', type: 'VARCHAR(100)' },
            { name: 'postal_code', type: 'VARCHAR(20)' },
            { name: 'country', type: 'VARCHAR(100)' },
            { name: 'registration_number', type: 'VARCHAR(255) UNIQUE' },
            { name: 'date_of_joining', type: 'DATE' },
            { name: 'religion', type: 'VARCHAR(100)' },
            { name: 'nationality', type: 'VARCHAR(100)' },
            { name: 'photo', type: 'VARCHAR(255)' },
            { name: 'student_notes', type: 'TEXT' },
            { name: 'drivers_license', type: 'VARCHAR(255)' },
            { name: 'dl_upload', type: 'VARCHAR(255)' },
            { name: 'student_pcp_info', type: 'TEXT' },
            { name: 'student_pcp_phone', type: 'VARCHAR(20)' },
            { name: 'semester', type: 'VARCHAR(50)' },
            { name: 'social_security_upload', type: 'VARCHAR(255)' },
            { name: 'emergency_contact_info', type: 'TEXT' },
            { name: 'emergency_contact_phone', type: 'VARCHAR(20)' },
            { name: 'other_emergency_contact', type: 'TEXT' },
            { name: 'caseworker_name', type: 'VARCHAR(255)' },
            { name: 'workforce_center', type: 'VARCHAR(255)' },
            { name: 'tara_ita_packet_upload', type: 'VARCHAR(255)' },
            { name: 'tara_ita_completion_date', type: 'DATE' },
            { name: 'voucher_dates', type: 'TEXT' },
            { name: 'info_session_date', type: 'DATE' },
            { name: 'notes', type: 'TEXT' },
            { name: 'attended_info_session', type: 'BOOLEAN' },
            { name: 'info_session_location', type: 'VARCHAR(255)' },
            { name: 'additional_comments', type: 'TEXT' },
            { name: 'signature', type: 'TEXT' },
            { name: 'name_capitalization', type: 'VARCHAR(100)' }
        ];
        
        let completedQueries = 0;
        const totalQueries = columnsToAdd.length;
        
        columnsToAdd.forEach((column, index) => {
            if (existingColumns.includes(column.name)) {
                console.log(`Column ${column.name} already exists, skipping...`);
                completedQueries++;
            } else {
                const alterQuery = `ALTER TABLE students ADD COLUMN ${column.name} ${column.type}`;
                db.query(alterQuery, (err, result) => {
                    if (err) {
                        console.error(`Error adding column ${column.name}:`, err);
                    } else {
                        console.log(`Successfully added column: ${column.name}`);
                    }
                    
                    completedQueries++;
                    
                    if (completedQueries === totalQueries) {
                        // All queries completed, check final structure
                        console.log('\n=== FINAL STUDENTS TABLE STRUCTURE ===');
                        db.query('DESCRIBE students', (err, results) => {
                            if (err) {
                                console.error('Error describing table:', err);
                            } else {
                                results.forEach(row => {
                                    console.log(`${row.Field} - ${row.Type} - ${row.Null} - ${row.Key} - ${row.Default}`);
                                });
                            }
                            console.log('==========================================\n');
                            db.end();
                        });
                    }
                });
            }
        });
    });
}); 