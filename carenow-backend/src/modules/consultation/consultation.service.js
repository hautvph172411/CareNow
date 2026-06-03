const repository = require('./consultation.repository');

exports.createConsultation = async (data) => {
  if (!data.patient_name || !data.patient_phone || !data.symptoms) {
    throw Object.assign(new Error('BAD_INPUT'), { detail: 'Họ tên, số điện thoại và tình trạng bệnh là bắt buộc' });
  }

  const result = await repository.create(data);
  return result;
};

exports.getAllConsultations = async (query = {}) => {
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

exports.getUnreadCount = async () => {
  const count = await repository.count({ status: 1 }); // 1: Chưa xử lý
  return count;
};

exports.updateStatus = async (id, status) => {
  const allowedStatuses = [1, 2];
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

exports.deleteConsultation = async (id) => {
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  const deleted = await repository.delete(id);
  return deleted;
};
