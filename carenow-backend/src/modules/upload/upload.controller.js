const { cloudinary } = require('../../config/cloudinary');

/**
 * POST /api/upload  (field name: "file", single)
 * Trả về URL Cloudinary sau khi upload thành công.
 */
exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Thiếu file upload' });
  }
  return res.status(201).json({
    success: true,
    data: {
      url:       req.file.path,       // secure_url
      public_id: req.file.filename,   // dùng để xóa sau này
      width:     req.file.width,
      height:    req.file.height,
      format:    req.file.format,
      bytes:     req.file.size,
    },
  });
};

/**
 * DELETE /api/upload/:public_id  — xóa ảnh khỏi Cloudinary.
 * Ghi chú: public_id khi nằm trong folder sẽ chứa dấu "/", client cần encodeURIComponent.
 */
exports.deleteImage = async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.public_id);
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    if (result.result !== 'ok' && result.result !== 'not found') {
      return res.status(500).json({ success: false, message: 'Không thể xóa ảnh', detail: result });
    }
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
