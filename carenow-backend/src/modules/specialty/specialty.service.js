const repository = require('./specialty.repository');

/** Normalize FK numeric: '' -> null, '5' -> 5 */
const normalizeNumeric = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};

const createSpecialty = async (payload) => {
  if (payload.service_id !== undefined) {
    payload.service_id = normalizeNumeric(payload.service_id);
  }
  payload.updated_time = Math.floor(Date.now() / 1000);
  return await repository.create(payload);
};

const getSpecialties = async (query) => {
  const limit = query.limit ? parseInt(query.limit) : 20;
  const page = query.page ? parseInt(query.page) : 1;
  const offset = (page - 1) * limit;

  const filters = {
    limit,
    offset,
    keyword: query.keyword,
    status: query.status,
    service_id: query.service_id,
  };

  const rows = await repository.findAll(filters);
  const total = await repository.count(filters);

  return {
    data: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getSpecialtyById = async (id) => {
  const specialty = await repository.findById(id);
  if (!specialty) throw new Error('NOT_FOUND');
  return specialty;
};

const updateSpecialty = async (id, payload) => {
  if (payload.service_id !== undefined) {
    payload.service_id = normalizeNumeric(payload.service_id);
  }
  // Bỏ service_name (do JOIN trả ra) nếu FE vô tình gửi lại
  delete payload.service_name;
  payload.updated_time = Math.floor(Date.now() / 1000);
  const updated = await repository.update(id, payload);
  if (!updated) throw new Error('NOT_FOUND');
  return updated;
};

const deleteSpecialty = async (id) => {
  const deleted = await repository.remove(id);
  if (!deleted) throw new Error('NOT_FOUND');
  return deleted;
};

module.exports = {
  createSpecialty,
  getSpecialties,
  getSpecialtyById,
  updateSpecialty,
  deleteSpecialty
};
