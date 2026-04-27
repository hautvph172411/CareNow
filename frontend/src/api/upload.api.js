import axios from './axios';

/**
 * Upload 1 file ảnh lên Cloudinary qua backend.
 * @param {File} file - đối tượng File từ <input type="file">
 * @returns {Promise<{ url: string, public_id: string, width: number, height: number, format: string, bytes: number }>}
 */
export const uploadImage = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await axios.post('/upload', form, {
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
