-- Add missing fields to students table
ALTER TABLE students 
ADD COLUMN gender VARCHAR(50) AFTER phone,
ADD COLUMN course VARCHAR(255) AFTER gender,
ADD COLUMN social_security_number VARCHAR(255) AFTER course,
ADD COLUMN course_pref1 VARCHAR(255) AFTER social_security_number,
ADD COLUMN days_pref1 VARCHAR(255) AFTER course_pref1,
ADD COLUMN location_pref1 VARCHAR(255) AFTER days_pref1,
ADD COLUMN course_pref2 VARCHAR(255) AFTER location_pref1,
ADD COLUMN days_pref2 VARCHAR(255) AFTER course_pref2,
ADD COLUMN location_pref2 VARCHAR(255) AFTER days_pref2,
ADD COLUMN date_of_birth DATE AFTER location_pref2;

-- Update existing students with some sample data
UPDATE students SET 
    gender = 'Male',
    course = 'Computer Science',
    social_security_number = '123-45-6789',
    course_pref1 = 'Web Development',
    days_pref1 = 'Monday, Wednesday',
    location_pref1 = 'Main Campus',
    course_pref2 = 'Data Science',
    days_pref2 = 'Tuesday, Thursday',
    location_pref2 = 'Downtown Campus',
    date_of_birth = '1995-01-15'
WHERE id = 1;

UPDATE students SET 
    gender = 'Female',
    course = 'Business Administration',
    social_security_number = '234-56-7890',
    course_pref1 = 'Marketing',
    days_pref1 = 'Monday, Friday',
    location_pref1 = 'Main Campus',
    course_pref2 = 'Finance',
    days_pref2 = 'Wednesday, Friday',
    location_pref2 = 'Downtown Campus',
    date_of_birth = '1992-03-20'
WHERE id = 2;

UPDATE students SET 
    gender = 'Male',
    course = 'Engineering',
    social_security_number = '345-67-8901',
    course_pref1 = 'Mechanical Engineering',
    days_pref1 = 'Tuesday, Thursday',
    location_pref1 = 'Engineering Campus',
    course_pref2 = 'Electrical Engineering',
    days_pref2 = 'Monday, Wednesday',
    location_pref2 = 'Engineering Campus',
    date_of_birth = '1990-07-10'
WHERE id = 3;

UPDATE students SET 
    gender = 'Female',
    course = 'Nursing',
    social_security_number = '456-78-9012',
    course_pref1 = 'Pediatric Nursing',
    days_pref1 = 'Monday, Wednesday, Friday',
    location_pref1 = 'Medical Campus',
    course_pref2 = 'Emergency Nursing',
    days_pref2 = 'Tuesday, Thursday',
    location_pref2 = 'Medical Campus',
    date_of_birth = '1993-11-25'
WHERE id = 4;

UPDATE students SET 
    gender = 'Male',
    course = 'Information Technology',
    social_security_number = '567-89-0123',
    course_pref1 = 'Cybersecurity',
    days_pref1 = 'Monday, Tuesday',
    location_pref1 = 'Tech Campus',
    course_pref2 = 'Network Administration',
    days_pref2 = 'Wednesday, Thursday',
    location_pref2 = 'Tech Campus',
    date_of_birth = '1988-09-05'
WHERE id = 5; 