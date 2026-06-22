const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config({ override: true });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log('[Cloudinary] configured for cloud_name =', process.env.CLOUDINARY_CLOUD_NAME);

// Multer storage: đẩy thẳng lên Cloudinary, không lưu file tạm trên server.
// Mỗi file sinh public_id ngẫu nhiên, giữ định dạng gốc.
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = process.env.CLOUDINARY_FOLDER || 'carenow';
    if (req.user && req.user.partner_id) {
      folder += '/partner_' + req.user.partner_id;
    }
    if (req.query.folder) {
      folder += '/' + req.query.folder;
    }
    const originalName = file.originalname.split('.').slice(0, -1).join('.');
    const cleanName = originalName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-zA-Z0-9-_]/g, '_'); // replace special characters with _
    return {
      folder: folder,
      public_id: cleanName,
      resource_type: 'image',
      // Chuẩn hoá: tối đa 1200px, giữ tỉ lệ, chất lượng auto
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
    };
  },
});

const MAX_SIZE_MB = 5;

const uploader = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Chỉ chấp nhận file ảnh'));
    }
    cb(null, true);
  },
});

module.exports = { cloudinary, uploader };
