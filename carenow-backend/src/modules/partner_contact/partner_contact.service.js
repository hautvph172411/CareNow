const repository = require('./partner_contact.repository');

exports.createPartnerContact = async (data) => {
  if (!data.contact_name || !data.contact_phone || !data.clinic_name) {
    throw Object.assign(new Error('BAD_INPUT'), { detail: 'Họ tên, số điện thoại và tên phòng khám là bắt buộc' });
  }

  const result = await repository.create(data);
  return result;
};

exports.getAllPartnerContacts = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const offset = (page - 1) * limit;

  const dbQuery = { limit, offset };
  if (query.status) dbQuery.status = parseInt(query.status);
  if (query.keyword) dbQuery.keyword = query.keyword;

  const [data, total] = await Promise.all([
    repository.getAll(dbQuery),
    repository.count(dbQuery),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.updateStatus = async (id, status) => {
  const allowedStatuses = [1, 2, 3];
  if (!allowedStatuses.includes(parseInt(status))) {
    throw Object.assign(new Error('BAD_INPUT'), { detail: 'Trạng thái không hợp lệ' });
  }

  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  const updated = await repository.updateStatus(id, status);
  return updated;
};

exports.deletePartnerContact = async (id) => {
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  const deleted = await repository.delete(id);
  return deleted;
};
