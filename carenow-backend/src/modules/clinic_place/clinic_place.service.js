const repo = require('./clinic_place.repository');

exports.getClinicPlaces = async (query = {}) => {
  const limit = query.limit ? parseInt(query.limit) : 20;
  const page  = query.page  ? parseInt(query.page)  : 1;
  const offset = (page - 1) * limit;

  const filters = { limit, offset, keyword: query.keyword, status: query.status };

  const rows  = await repo.getAll(filters);
  const total = await repo.count(filters);

  return {
    data: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.getClinicPlaceById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw new Error('NOT_FOUND');
  return item;
};

exports.createClinicPlace = async (data) => {
  if (!data.name) throw new Error('Tên không được để trống');
  return await repo.create(data);
};

exports.updateClinicPlace = async (id, data) => {
  const exists = await repo.findById(id);
  if (!exists) throw new Error('NOT_FOUND');
  const updated = await repo.update(id, data);
  if (!updated) throw new Error('Không có trường nào được cập nhật');
  return updated;
};

exports.deleteClinicPlace = async (id) => {
  const deleted = await repo.remove(id);
  if (!deleted) throw new Error('NOT_FOUND');
  return deleted;
};
