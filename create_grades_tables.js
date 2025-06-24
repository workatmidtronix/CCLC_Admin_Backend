const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'P@ssword_1234',
    database: process.env.DB_NAME || 'cclc'
};

async function createGradesTables() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database successfully');

        // Create grade_categories table
        console.log('Creating grade_categories table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS grade_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                instructor_id INT,
                category_name VARCHAR(100) NOT NULL,
                weight DECIMAL(5,2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL
            )
        `);
        console.log('grade_categories table created successfully');

        // Create grade_columns table
        console.log('Creating grade_columns table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS grade_columns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                category_id INT NOT NULL,
                column_name VARCHAR(200) NOT NULL,
                max_points DECIMAL(8,2) DEFAULT 0.00,
                include_in_calculation BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES grade_categories(id) ON DELETE CASCADE
            )
        `);
        console.log('grade_columns table created successfully');

        // Insert sample data for grade_categories
        console.log('Inserting sample grade categories...');
        const sampleCategories = [
            { course_id: 1, instructor_id: 1, category_name: 'Exams', weight: 30.00 },
            { course_id: 1, instructor_id: 1, category_name: 'Final Exam', weight: 30.00 },
            { course_id: 1, instructor_id: 1, category_name: 'Quizzes', weight: 10.00 },
            { course_id: 1, instructor_id: 1, category_name: 'Homework', weight: 10.00 },
            { course_id: 1, instructor_id: 1, category_name: 'Clinical (EKG Lab)', weight: 20.00 }
        ];

        for (const category of sampleCategories) {
            await connection.execute(
                'INSERT INTO grade_categories (course_id, instructor_id, category_name, weight) VALUES (?, ?, ?, ?)',
                [category.course_id, category.instructor_id, category.category_name, category.weight]
            );
        }
        console.log('Sample grade categories inserted successfully');

        // Insert sample data for grade_columns
        console.log('Inserting sample grade columns...');
        const sampleColumns = [
            { course_id: 1, category_id: 5, column_name: 'Clinical Exam- Anatomy & EKG Tracings', max_points: 100.00, include_in_calculation: false },
            { course_id: 1, category_id: 5, column_name: 'Clinical Quiz- EKG Machine Set Up, Patient Bedside Manners & Leads Placement', max_points: 5.00, include_in_calculation: true },
            { course_id: 1, category_id: 4, column_name: 'Homework Chapter 1', max_points: 1.00, include_in_calculation: true },
            { course_id: 1, category_id: 4, column_name: 'Homework Chapters 2 & 3', max_points: 2.00, include_in_calculation: true },
            { course_id: 1, category_id: 1, column_name: 'Exam 1 = Chapter 3, 4, & 8', max_points: 100.00, include_in_calculation: true },
            { course_id: 1, category_id: 1, column_name: 'Exam 2 = Chapter 5, 6, 7 & 9', max_points: 100.00, include_in_calculation: false },
            { course_id: 1, category_id: 3, column_name: 'Quiz 1 - Chapter 1 & 2', max_points: 40.00, include_in_calculation: true },
            { course_id: 1, category_id: 4, column_name: 'Homework Chapter 4', max_points: 1.00, include_in_calculation: true },
            { course_id: 1, category_id: 4, column_name: 'Homework Chapter 5, 6 & 8', max_points: 3.00, include_in_calculation: true },
            { course_id: 1, category_id: 4, column_name: 'Homework Chapter 7', max_points: 1.00, include_in_calculation: false },
            { course_id: 1, category_id: 3, column_name: 'Quiz 2 - Chapter 7 and 9', max_points: 40.00, include_in_calculation: false },
            { course_id: 1, category_id: 2, column_name: 'Comprehensive Final Exam', max_points: 100.00, include_in_calculation: false },
            { course_id: 1, category_id: 4, column_name: 'Homework Chapter 9 & 10', max_points: 2.00, include_in_calculation: false }
        ];

        for (const column of sampleColumns) {
            await connection.execute(
                'INSERT INTO grade_columns (course_id, category_id, column_name, max_points, include_in_calculation) VALUES (?, ?, ?, ?, ?)',
                [column.course_id, column.category_id, column.column_name, column.max_points, column.include_in_calculation]
            );
        }
        console.log('Sample grade columns inserted successfully');

        console.log('Grades tables created and populated successfully!');

    } catch (error) {
        console.error('Error creating grades tables:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

createGradesTables(); 