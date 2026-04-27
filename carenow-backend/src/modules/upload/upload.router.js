const express = require('express');
const router = express.Router();
const { uploader } = require('../../config/cloudinary');
const controller = require('./upload.controller');

// Middleware xử lý lỗi multer (file quá to / sai mimetype) trả JSON gọn.
const handleMulter = (req, res, next) => {
  uploader.single('file')(req, res, (err) => {
    if (err) {
      console.error('[UPLOAD ERROR]', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Upload failed',
        detail: err?.http_code ? { http_code: err.http_code, name: err.name } : undefined,
      });
    }
    next();
  });
};

router.post('/', handleMulter, controller.uploadImage);
router.delete('/:public_id', controller.deleteImage);

module.exports = router;
