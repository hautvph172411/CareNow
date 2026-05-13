const service = require('./blog_public.service');

const handleError = (res, error) => {
  if (error.message === 'NOT_FOUND') return res.status(404).json({ message: 'Không tìm thấy bài cẩm nang' });
  if (error.message === 'TITLE_REQUIRED') return res.status(400).json({ message: 'Tiêu đề bài viết không được để trống' });
  if (error.message === 'URL_REQUIRED') return res.status(400).json({ message: 'URL bài viết không được để trống' });
  if (error.message === 'NO_VALID_FIELDS') return res.status(400).json({ message: 'Không có trường hợp lệ để cập nhật' });
  return res.status(500).json({ message: error.message });
};

const create = async (req, res) => {
  try {
    const data = await service.createBlogPublic(req.body);
    res.status(201).json({ message: 'Success', data });
  } catch (e) { handleError(res, e); }
};

const list = async (req, res) => {
  try {
    const result = await service.getBlogPublicList(req.query);
    res.status(200).json({ message: 'Success', ...result });
  } catch (e) { handleError(res, e); }
};

const detail = async (req, res) => {
  try {
    const data = await service.getBlogPublicById(req.params.id);
    res.status(200).json({ message: 'Success', data });
  } catch (e) { handleError(res, e); }
};

const update = async (req, res) => {
  try {
    const data = await service.updateBlogPublic(req.params.id, req.body);
    res.status(200).json({ message: 'Success', data });
  } catch (e) { handleError(res, e); }
};

const remove = async (req, res) => {
  try {
    await service.deleteBlogPublic(req.params.id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (e) { handleError(res, e); }
};

module.exports = { create, list, detail, update, remove };
