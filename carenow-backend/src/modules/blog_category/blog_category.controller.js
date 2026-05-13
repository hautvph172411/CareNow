const service = require('./blog_category.service');

const handleError = (res, error) => {
  if (error.message === 'NOT_FOUND') return res.status(404).json({ message: 'Không tìm thấy danh mục cẩm nang' });
  if (error.message === 'NAME_REQUIRED') return res.status(400).json({ message: 'Tên danh mục không được để trống' });
  if (error.message === 'NO_VALID_FIELDS') return res.status(400).json({ message: 'Không có trường hợp lệ để cập nhật' });
  return res.status(500).json({ message: error.message });
};

const create = async (req, res) => {
  try {
    const data = await service.createBlogCategory(req.body);
    res.status(201).json({ message: 'Success', data });
  } catch (e) { handleError(res, e); }
};

const list = async (req, res) => {
  try {
    const result = await service.getBlogCategories(req.query);
    res.status(200).json({ message: 'Success', ...result });
  } catch (e) { handleError(res, e); }
};

const detail = async (req, res) => {
  try {
    const data = await service.getBlogCategoryById(req.params.id);
    res.status(200).json({ message: 'Success', data });
  } catch (e) { handleError(res, e); }
};

const update = async (req, res) => {
  try {
    const data = await service.updateBlogCategory(req.params.id, req.body);
    res.status(200).json({ message: 'Success', data });
  } catch (e) { handleError(res, e); }
};

const remove = async (req, res) => {
  try {
    await service.deleteBlogCategory(req.params.id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (e) { handleError(res, e); }
};

module.exports = { create, list, detail, update, remove };
