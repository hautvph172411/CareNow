const repository = require('./blog_public.repository');

const ALLOWED_FIELDS = [
  'type', 'title', 'picture', 'picture_alt', 'summary', 'content', 'url',
  'description', 'published_time', 'published_by', 'published_start',
  'published_version', 'version', 'status', 'views', 'categories',
  'created_by', 'updated_by', 'rank', 'show_related_article',
  'show_list_category', 'is_check', 'show_comment', 'show_phone', 'reason',
  'references', 'next_post', 'suggest_specialist', 'suggest_doctor',
  'suggest_content', 'custom_button_text', 'custom_button_link', 'author',
  'advisor', 'censor', 'tag', 'metadata',
];

const INTEGER_FIELDS = [
  'type', 'published_time', 'published_by', 'published_start',
  'published_version', 'version', 'status', 'views', 'created_by',
  'updated_by', 'rank', 'show_related_article', 'show_list_category',
  'is_check', 'show_comment', 'show_phone', 'reason', 'next_post',
  'suggest_specialist', 'suggest_doctor',
];

const now = () => Math.floor(Date.now() / 1000);

const sanitize = (payload = {}) => {
  const out = {};
  for (const field of ALLOWED_FIELDS) {
    if (payload[field] !== undefined) out[field] = payload[field];
  }
  return out;
};

const csvFromValue = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(',');
  return value;
};

const normalize = (data) => {
  if (data.categories !== undefined) data.categories = csvFromValue(data.categories);
  for (const field of INTEGER_FIELDS) {
    if (data[field] === '') data[field] = null;
    if (data[field] !== undefined && data[field] !== null) {
      data[field] = parseInt(data[field], 10);
      if (Number.isNaN(data[field])) data[field] = null;
    }
  }
  return data;
};

const applyDefaults = (data) => {
  data.type = data.type ?? 1;
  data.status = data.status ?? 1;
  data.views = data.views ?? 0;
  data.rank = data.rank ?? 99;
  data.show_related_article = data.show_related_article ?? 1;
  data.show_list_category = data.show_list_category ?? 1;
  data.is_check = data.is_check ?? 0;
  data.show_comment = data.show_comment ?? 1;
  data.show_phone = data.show_phone ?? 0;
  data.version = data.version ?? 1;
  return data;
};

const createBlogPublic = async (payload) => {
  const data = applyDefaults(normalize(sanitize(payload)));
  if (!data.title || !data.title.trim()) throw new Error('TITLE_REQUIRED');
  if (!data.url || !data.url.trim()) throw new Error('URL_REQUIRED');
  data.created_time = now();
  data.updated_time = now();
  return repository.create(data);
};

const getBlogPublicList = async (query = {}) => {
  const limit = query.limit ? parseInt(query.limit, 10) : 20;
  const page = query.page ? parseInt(query.page, 10) : 1;
  const filters = {
    limit,
    page,
    offset: (page - 1) * limit,
    keyword: query.keyword,
    status: query.status,
    reason: query.reason,
  };
  const rows = await repository.findAll(filters);
  const total = await repository.count(filters);
  return {
    data: rows,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const getBlogPublicById = async (id) => {
  const row = await repository.findById(id);
  if (!row) throw new Error('NOT_FOUND');
  return row;
};

const updateBlogPublic = async (id, payload) => {
  const data = normalize(sanitize(payload));
  if (Object.keys(data).length === 0) throw new Error('NO_VALID_FIELDS');
  data.updated_time = now();
  const row = await repository.update(id, data);
  if (!row) throw new Error('NOT_FOUND');
  return row;
};

const deleteBlogPublic = async (id) => {
  const row = await repository.remove(id);
  if (!row) throw new Error('NOT_FOUND');
  return row;
};

module.exports = {
  createBlogPublic,
  getBlogPublicList,
  getBlogPublicById,
  updateBlogPublic,
  deleteBlogPublic,
};
