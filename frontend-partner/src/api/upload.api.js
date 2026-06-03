import axios from './axios';

/**
 * Lấy danh sách thư mục và ảnh
 * @param {string} folder - đường dẫn thư mục hiện tại (rỗng = thư mục gốc)
 */
export const getMediaFiles = async (folder = '') => {
  const res = await axios.get(`/upload/media?folder=${encodeURIComponent(folder)}`);
  return res.data;
};

/**
 * Tạo thư mục mới
 * @param {string} path - tên thư mục mới
 */
export const createFolder = async (path) => {
  const res = await axios.post('/upload/folder', { path });
  return res.data;
};

/**
 * Upload 1 file ảnh lên Cloudinary qua backend.
 * @param {File} file - đối tượng File từ <input type="file">
 * @param {string} folder - thư mục đích (tùy chọn)
 * @returns {Promise<{ url: string, public_id: string, width: number, height: number, format: string, bytes: number }>}
 */
export const uploadImage = async (file, folder = '') => {
  const form = new FormData();
  form.append('file', file);
  const url = folder ? `/upload?folder=${encodeURIComponent(folder)}` : '/upload';
  const res = await axios.post(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
};

/**
 * Xóa ảnh theo public_id (khi user đổi ảnh khác hoặc xóa entity).
 */
export const deleteImage = async (publicId) => {
  const res = await axios.delete(`/upload/${encodeURIComponent(publicId)}`);
  return res.data;
};

/**
 * Xóa thư mục theo path.
 */
export const deleteFolder = async (path) => {
  const res = await axios.delete(`/upload/folder?path=${encodeURIComponent(path)}`);
  return res.data;
};
