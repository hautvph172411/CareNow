const repository = require('./specialty.repository');

const createSpecialty = async (payload) => {
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
    status: query.status
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
