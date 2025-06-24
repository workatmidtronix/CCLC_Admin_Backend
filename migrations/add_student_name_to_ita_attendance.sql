-- Add student_name column to ita_attendance_signed table
ALTER TABLE ita_attendance_signed 
ADD COLUMN student_name VARCHAR(255) AFTER student_id;

-- Update existing records with student names from the students table
UPDATE ita_attendance_signed ias
JOIN students s ON ias.student_id = s.id
SET ias.student_name = CONCAT(s.first_name, ' ', s.last_name)
WHERE ias.student_name IS NULL; 