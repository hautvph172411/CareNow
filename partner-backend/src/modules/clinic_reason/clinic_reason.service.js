const repository = require('./clinic_reason.repository');

const ALLOWED_FIELDS = [
  'clinic_id', 'name', 'rank', 'status', 'title', 'url',
  'description', 'content', 'place_id', 'in_trash_clinic_ids',
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
  if (data.rank !== undefined) data.rank = parseInt(data.rank, 10) || 99;
  if (data.status !== undefined) data.status = parseInt(data.status, 10);
  if (data.place_id === '') data.place_id = null;
  if (data.place_id !== undefined && data.place_id !== null) data.place_id = parseInt(data.place_id, 10) || null;
  if (data.clinic_id !== undefined) data.clinic_id = csvFromValue(data.clinic_id);
  if (data.in_trash_clinic_ids !== undefined) data.in_trash_clinic_ids = csvFromValue(data.in_trash_clinic_ids);
  return data;
};

const createClinicReason = async (payload) => {
  const data = normalize(sanitize(payload));
  if (!data.name || !data.name.trim()) throw new Error('NAME_REQUIRED');
  data.status = data.status === undefined ? 1 : data.status;
  data.rank = data.rank === undefined ? 99 : data.rank;
  data.updated_at = now();
  return repository.create(data);
};

const getClinicReasons = async (query = {}) => {
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

const getClinicReasonById = async (id) => {
  const row = await repository.findById(id);
  if (!row) throw new Error('NOT_FOUND');
  return row;
};

const updateClinicReason = async (id, payload) => {
  const data = normalize(sanitize(payload));
  if (Object.keys(data).length === 0) throw new Error('NO_VALID_FIELDS');
  data.updated_at = now();
  const row = await repository.update(id, data);
  if (!row) throw new Error('NOT_FOUND');
  return row;
};

const deleteClinicReason = async (id) => {
  const row = await repository.remove(id);
  if (!row) throw new Error('NOT_FOUND');
  return row;
};

module.exports = {
  createClinicReason,
  getClinicReasons,
  getClinicReasonById,
  updateClinicReason,
  deleteClinicReason,
};
