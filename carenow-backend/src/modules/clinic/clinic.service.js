const clinicRepo = require('./clinic.repository');

exports.getClinics = async () => {
  return await clinicRepo.getAll();
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
  return await clinicRepo.delete(id);
};
