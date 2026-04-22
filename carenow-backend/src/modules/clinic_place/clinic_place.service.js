const repo = require('./clinic_place.repository');

const cleanPayload = (data) => {
  const payload = { ...data };

  // Ensure proper integer conversions
  const intFields = ['status', 'order', 'rank', 'page_type', 'self_supported', 'partner_id', 'parent_id'];
  intFields.forEach(field => {
    if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
      payload[field] = parseInt(payload[field], 10);
    } else {
      payload[field] = field === 'order' ? 99 : 0;
    }
  });

  // Handle location IDs (can be null)
  ['province_id', 'district_id'].forEach(field => {
    if (payload[field] === '' || payload[field] === undefined || payload[field] === null) {
      payload[field] = null;
    } else {
      payload[field] = parseInt(payload[field], 10);
    }
  });

  // Boolean to tinyint conversion
  ['has_insurance', 'show_children'].forEach(field => {
    if (typeof payload[field] === 'boolean') {
      payload[field] = payload[field] ? 1 : 0;
    }
  });

  // Timestamps
  if (!payload.created_at) {
    payload.created_at = Math.floor(Date.now() / 1000);
  }
  payload.updated_at = Math.floor(Date.now() / 1000);

  // Remove empty strings for optional fields
  Object.keys(payload).forEach(key => {
    if (payload[key] === '') {
      payload[key] = null;
    }
  });

  return payload;
};

exports.getClinicPlaces = async (query = {}) => {
  const limit = query.limit ? parseInt(query.limit) : 20;
  const page = query.page ? parseInt(query.page) : 1;
  const offset = (page - 1) * limit;

  const filters = { limit, offset, keyword: query.keyword, status: query.status, province_id: query.province_id };

  const rows = await repo.getAll(filters);
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
  if (!data.name) throw new Error('Tên cơ sở y tế không được để trống');
  if (!data.display_name) throw new Error('Tên hiển thị không được để trống');

  const payload = cleanPayload(data);
  return await repo.create(payload);
};

exports.updateClinicPlace = async (id, data) => {
  const exists = await repo.findById(id);
  if (!exists) throw new Error('NOT_FOUND');

  const payload = cleanPayload(data);
  delete payload.created_at; // Don't update created_at

  const updated = await repo.update(id, payload);
  if (!updated) throw new Error('Không có trường nào được cập nhật');
  return updated;
};

exports.deleteClinicPlace = async (id) => {
  const deleted = await repo.remove(id);
  if (!deleted) throw new Error('NOT_FOUND');
  return deleted;
};
