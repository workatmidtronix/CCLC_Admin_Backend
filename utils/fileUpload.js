const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for different upload types
const createStorage = (uploadType, email) => {
  return multer.diskStorage({
  destination: function (req, file, cb) {
      // Get email from request body
      const userEmail = req.body.email || email;
      
      if (!userEmail) {
        return cb(new Error('Email is required for file upload'), null);
      }

      // Create a safe folder name from email (remove special characters)
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Create upload directory based on type
      let uploadDir;
      switch (uploadType) {
        case 'staff':
          uploadDir = path.join(__dirname, '../../uploads/staff', safeEmail);
          break;
        case 'instructor':
          uploadDir = path.join(__dirname, '../../uploads/instructor', safeEmail);
          break;
        case 'student':
          uploadDir = path.join(__dirname, '../../uploads/students', safeEmail);
          break;
        default:
          uploadDir = path.join(__dirname, '../../uploads', safeEmail);
      }

      // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
      // Map field names to specific file names for students
      if (uploadType === 'student') {
        const fieldToFileName = {
          'photo': 'profile',
          'dlUpload': 'DL',
          'socialSecurityUpload': 'SSN',
          'taraItaPacketUpload': 'taraIT',
          'voucherDates': 'voucherDates'
        };

        const baseFileName = fieldToFileName[file.fieldname] || file.fieldname;
        const fileExtension = path.extname(file.originalname);
        const fileName = `${baseFileName}${fileExtension}`;
        cb(null, fileName);
      } else {
        // For staff and instructor, use 'profileImage' with extension
        cb(null, 'profileImage' + path.extname(file.originalname));
      }
    }
  });
};

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'), false);
  }
};

// Configure multer for different upload types
const createUpload = (uploadType, fieldName = 'photo') => {
  const storage = createStorage(uploadType);
  
  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  }).single(fieldName);
};

// Configure multer for student multiple file uploads
const createStudentUpload = () => {
  const storage = createStorage('student');
  
  return multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
  }).fields([
    { name: 'photo', maxCount: 1 },
    { name: 'dlUpload', maxCount: 1 },
    { name: 'socialSecurityUpload', maxCount: 1 },
    { name: 'taraItaPacketUpload', maxCount: 1 },
    { name: 'voucherDates', maxCount: 1 }
  ]);
};

// Helper function to get relative path for database storage
const getRelativePath = (uploadType, email, filename) => {
  const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
  
  switch (uploadType) {
    case 'staff':
      return `/uploads/staff/${safeEmail}/${filename}`;
    case 'instructor':
      return `/uploads/instructor/${safeEmail}/${filename}`;
    case 'student':
      return `/uploads/students/${safeEmail}/${filename}`;
    default:
      return `/uploads/${safeEmail}/${filename}`;
  }
};

// Helper function to get absolute path for file operations
const getAbsolutePath = (uploadType, email, filename) => {
  const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
  
  switch (uploadType) {
    case 'staff':
      return path.join(__dirname, '../../uploads/staff', safeEmail, filename);
    case 'instructor':
      return path.join(__dirname, '../../uploads/instructor', safeEmail, filename);
    case 'student':
      return path.join(__dirname, '../../uploads/students', safeEmail, filename);
    default:
      return path.join(__dirname, '../../uploads', safeEmail, filename);
  }
};

// Helper function to handle multiple file uploads (for students)
const handleStudentFileUpload = () => {
  return createStudentUpload();
};

// Helper function to handle single file uploads (for staff and instructors)
const handleSingleFileUpload = (uploadType, fieldName = 'photo') => {
  return createUpload(uploadType, fieldName);
};

module.exports = {
  handleStudentFileUpload,
  handleSingleFileUpload,
  getRelativePath,
  getAbsolutePath,
  createStorage,
  fileFilter
}; 