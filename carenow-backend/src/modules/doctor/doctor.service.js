const repo = require('./doctor.repository');

exports.getDoctors = async () => {
  return await repo.getAll();
};

exports.getDoctorById = async (id) => {
  const doctor = await repo.findById(id);
  if (!doctor) throw new Error('Bác sĩ không tồn tại');
  return doctor;
};

exports.createDoctor = async (data) => {
  if (!data.name || !data.specialty) {
    throw new Error('Tên và chuyên khoa là bắt buộc');
  }
  return await repo.create(data);
};

exports.updateDoctor = async (id, data) => {
  const exists = await repo.findById(id);
  if (!exists) throw new Error('Bác sĩ không tồn tại');

  const updated = await repo.update(id, data);
  if (!updated) throw new Error('Không có trường nào được cập nhật');
  return updated;
};

exports.deleteDoctor = async (id) => {
  const deleted = await repo.remove(id);
  if (!deleted) throw new Error('Bác sĩ không tồn tại');
  return deleted;
};
