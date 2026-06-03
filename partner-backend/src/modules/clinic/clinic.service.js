const clinicRepo = require('./clinic.repository');

exports.getClinics = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    clinicRepo.getAll({ ...query, limit, offset }),
    clinicRepo.count(query)
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

exports.createClinic = async (data) => {
  // Add timestamps
  data.created_at = Math.floor(Date.now() / 1000);
  data.updated_at = Math.floor(Date.now() / 1000);
  return await clinicRepo.create(data);
};

exports.getClinicById = async (id) => {
  return await clinicRepo.findById(id);
};

exports.updateClinic = async (id, data) => {
  data.updated_at = Math.floor(Date.now() / 1000);
  return await clinicRepo.update(id, data);
};

exports.deleteClinic = async (id) => {
  const apptCount = await clinicRepo.countAppointments(id);
  if (apptCount > 0) {
    const err = new Error('Không thể xóa bác sĩ đang có lịch hẹn');
    err.status = 400;
    throw err;
  }
  return await clinicRepo.delete(id);
};
