const repository = require('./blog_category.repository');

const ALLOWED_FIELDS = [
  'name', 'title', 'url', 'description', 'content',
  'rank', 'status',
];

const now = () => Math.floor(Date.now() / 1000);

const sanitize = (payload = {}) => {
  const out = {};
  for (const field of ALLOWED_FIELDS) {
    if (payload[field] !== undefined) out[field] = payload[field];
  }
  return out;
};

const normalizeNumbers = (data) => {
  if (data.rank !== undefined) data.rank = parseInt(data.rank, 10) || 99;
  if (data.status !== undefined) data.status = parseInt(data.status, 10);
  return data;
};

const createBlogCategory = async (payload) => {
  const data = normalizeNumbers(sanitize(payload));
  if (!data.name || !data.name.trim()) throw new Error('NAME_REQUIRED');
  data.status = data.status === undefined ? 1 : data.status;
  data.rank = data.rank === undefined ? 99 : data.rank;
  data.created_at = now();
  data.updated_at = now();
  return repository.create(data);
};

const getBlogCategories = async (query = {}) => {
  const limit = query.limit ? parseInt(query.limit, 10) : 20;
  const page = query.page ? parseInt(query.page, 10) : 1;
  const filters = {
    limit,
    page,
    offset: (page - 1) * limit,
    keyword: query.keyword,
    status: query.status,
  };
  const rows = await repository.findAll(filters);
  const total = await repository.count(filters);
  return {
    data: rows,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const getBlogCategoryById = async (id) => {
  const row = await repository.findById(id);
  if (!row) throw new Error('NOT_FOUND');
  return row;
};

const updateBlogCategory = async (id, payload) => {
  const data = normalizeNumbers(sanitize(payload));
  if (Object.keys(data).length === 0) throw new Error('NO_VALID_FIELDS');
  data.updated_at = now();
  const row = await repository.update(id, data);
  if (!row) throw new Error('NOT_FOUND');
  return row;
};

const deleteBlogCategory = async (id) => {
  const row = await repository.remove(id);
  if (!row) throw new Error('NOT_FOUND');
  return row;
};

module.exports = {
  createBlogCategory,
  getBlogCategories,
  getBlogCategoryById,
  updateBlogCategory,
  deleteBlogCategory,
};
