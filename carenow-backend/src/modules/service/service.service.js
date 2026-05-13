const repository = require('./service.repository');

/** Các field cho phép insert/update — whitelist để chặn ghi đè cột ngoài ý muốn */
const ALLOWED_FIELDS = [
  'name', 'url', 'description', 'image', 'content',
  'rank', 'status',
];

const sanitize = (payload) => {
  const out = {};
  for (const k of ALLOWED_FIELDS) {
    if (payload[k] !== undefined) out[k] = payload[k];
  }
  return out;
};

const now = () => Math.floor(Date.now() / 1000);

const createService = async (payload) => {
  const data = sanitize(payload);
  if (!data.name || !data.name.trim()) throw new Error('NAME_REQUIRED');

  data.rank   = parseInt(data.rank, 10)   || 99;
  data.status = data.status === undefined ? 1 : parseInt(data.status, 10);
  data.created_at = now();
  data.updated_at = now();

  return await repository.create(data);
};

const getServices = async (query) => {
  const limit = query.limit ? parseInt(query.limit, 10) : 20;
  const page  = query.page  ? parseInt(query.page, 10)  : 1;
  const offset = (page - 1) * limit;

  const filters = {
    limit, offset,
    keyword: query.keyword,
    status:  query.status,
  };

  const rows  = await repository.findAll(filters);
  const total = await repository.count(filters);

  return {
    data: rows,
    pagination: {
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getServiceById = async (id) => {
  const row = await repository.findById(id);
  if (!row) throw new Error('NOT_FOUND');
  return row;
};

const updateService = async (id, payload) => {
  const data = sanitize(payload);
  if (Object.keys(data).length === 0) throw new Error('NO_VALID_FIELDS');

  if (data.rank   !== undefined) data.rank   = parseInt(data.rank, 10)   || 99;
  if (data.status !== undefined) data.status = parseInt(data.status, 10);
  data.updated_at = now();

  const row = await repository.update(id, data);
  if (!row) throw new Error('NOT_FOUND');
  return row;
};

const deleteService = async (id) => {
  const row = await repository.remove(id);
  if (!row) throw new Error('NOT_FOUND');
  return row;
};

module.exports = {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
};
