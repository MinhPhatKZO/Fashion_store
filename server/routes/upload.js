const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Đã tạo thư mục uploads');
}

// Cấu hình nơi lưu file upload
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir); // Sử dụng đường dẫn tuyệt đối
  },
  filename(req, file, cb) {
    // Tạo tên file an toàn hơn
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  },
});

// File filter - chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// API upload 1 ảnh
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Không có file được tải lên!' 
      });
    }

    // Trả về đường dẫn file để lưu vào database
    const imagePath = `/uploads/${req.file.filename}`;
  
    console.log('Upload thành công:', req.file.filename);
    
    res.json({ 
      success: true,
      message: 'Upload ảnh thành công',
      imagePath,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error(' Lỗi upload:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi upload ảnh',
      error: error.message 
    });
  }
});

// API upload nhiều ảnh
router.post('/multiple', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Không có file nào được tải lên!' 
      });
    }

    const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
    
    console.log(`Upload ${req.files.length} ảnh thành công`);
    
    res.json({ 
      success: true,
      message: `Upload ${req.files.length} ảnh thành công`,
      imagePaths,
      files: req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: `/uploads/${file.filename}`
      }))
    });
  } catch (error) {
    console.error('❌ Lỗi upload multiple:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi upload ảnh',
      error: error.message 
    });
  }
});

//  Xử lý lỗi Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        message: 'File quá lớn! Kích thước tối đa là 5MB' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false,
        message: 'Quá nhiều file! Tối đa 10 ảnh' 
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        success: false,
        message: 'Field name không đúng! Sử dụng "image" hoặc "images"' 
      });
    }
  }
  
  res.status(500).json({ 
    success: false,
    message: error.message 
  });
});

module.exports = router;