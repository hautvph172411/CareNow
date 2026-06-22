const { cloudinary } = require('../../config/cloudinary');

/**
 * Lấy danh sách thư mục và ảnh trong một thư mục cụ thể
 * GET /api/upload/media?folder=...
 */
exports.getMedia = async (req, res) => {
  try {
    let folderPath = 'carenow';
    const partnerPrefix = req.user?.partner_id ? `/partner_${req.user.partner_id}` : '';
    folderPath += partnerPrefix;

    if (req.query.folder) {
      folderPath += '/' + req.query.folder;
    }

    // 1. Lấy danh sách sub-folders
    let folders = [];
    try {
      const folderRes = await cloudinary.api.sub_folders(folderPath);
      const baseLen = ('carenow' + partnerPrefix + '/').length;
      folders = folderRes.folders.map(f => ({
        name: f.name,
        path: f.path.substring(baseLen) // path relative to partner base
      }));
    } catch (err) {
      // Bỏ qua lỗi nếu folder không tồn tại hoặc không có subfolder
    }

    // 2. Lấy danh sách ảnh trong folder
    let images = [];
    try {
      const searchRes = await cloudinary.search
        .expression(`folder:"${folderPath}"`)
        .sort_by('created_at', 'desc')
        .max_results(50)
        .execute();
      
      images = searchRes.resources.map(r => ({
        public_id: r.public_id,
        url: r.secure_url,
        format: r.format,
        created_at: r.created_at,
        width: r.width,
        height: r.height
      }));
    } catch (err) {
      console.error(err);
    }

    return res.status(200).json({
      success: true,
      data: { folders, images, currentFolder: req.query.folder || '' }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Tạo thư mục mới
 * POST /api/upload/folder
 * Body: { path: '...' } (đường dẫn tương đối tính từ 'carenow/')
 */
exports.createFolder = async (req, res) => {
  try {
    if (!req.body.path) {
      return res.status(400).json({ success: false, message: 'Thiếu tên thư mục' });
    }
    const partnerPrefix = req.user?.partner_id ? `/partner_${req.user.partner_id}` : '';
    const fullPath = 'carenow' + partnerPrefix + '/' + req.body.path;
    await cloudinary.api.create_folder(fullPath);
    return res.status(200).json({ success: true, message: 'Tạo thư mục thành công' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/upload  (field name: "file", single)
 */
exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Thiếu file upload' });
  }
  return res.status(201).json({
    success: true,
    data: {
      url:       req.file.path,
      public_id: req.file.filename,
      width:     req.file.width,
      height:    req.file.height,
      format:    req.file.format,
      bytes:     req.file.size,
    },
  });
};

/**
 * DELETE /api/upload/:public_id
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

// Helper để xóa đệ quy các thư mục con và tài nguyên bên trong
const deleteFolderRecursively = async (fullPath) => {
  try {
    const subRes = await cloudinary.api.sub_folders(fullPath);
    for (const sub of subRes.folders) {
      await deleteFolderRecursively(sub.path);
    }
  } catch (err) {
    // Bỏ qua lỗi nếu không có thư mục con hoặc không tìm thấy thư mục
  }

  // Xóa tất cả ảnh trong thư mục này
  try {
    await cloudinary.api.delete_resources_by_prefix(fullPath + '/');
  } catch (err) {
    console.error('Lỗi khi xóa tài nguyên trong thư mục:', err);
  }

  // Xóa chính thư mục này
  return await cloudinary.api.delete_folder(fullPath);
};

/**
 * DELETE /api/upload/folder
 * Query: ?path=...
 */
exports.deleteFolder = async (req, res) => {
  try {
    const folderPath = req.query.path;
    if (!folderPath) {
      return res.status(400).json({ success: false, message: 'Thiếu đường dẫn thư mục' });
    }
    const partnerPrefix = req.user?.partner_id ? `/partner_${req.user.partner_id}` : '';
    const fullPath = 'carenow' + partnerPrefix + '/' + folderPath;
    const result = await deleteFolderRecursively(fullPath);
    return res.status(200).json({ success: true, message: 'Xóa thư mục thành công', data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
