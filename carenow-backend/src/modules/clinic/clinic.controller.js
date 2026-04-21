const clinicService = require('./clinic.service');

exports.getClinics = async (req, res) => {
  try {
    const data = await clinicService.getClinics();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createClinic = async (req, res) => {
  try {
    const data = await clinicService.createClinic(req.body);
    res.status(201).json({ success: true, data, message: 'Thêm mới thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getClinicById = async (req, res) => {
  try {
    const data = await clinicService.getClinicById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateClinic = async (req, res) => {
  try {
    const data = await clinicService.updateClinic(req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteClinic = async (req, res) => {
  try {
    const success = await clinicService.deleteClinic(req.params.id);
    if (!success) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
