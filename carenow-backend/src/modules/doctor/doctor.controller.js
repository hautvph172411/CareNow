const service = require('./doctor.service');

exports.list = async (req, res) => {
  try {
    const data = await service.getDoctors();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.detail = async (req, res) => {
  try {
    const data = await service.getDoctorById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = await service.createDoctor(req.body);
    res.status(201).json({ success: true, data, message: 'Thêm bác sĩ thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await service.updateDoctor(req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật bác sĩ thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await service.deleteDoctor(req.params.id);
    res.json({ success: true, message: 'Xoá bác sĩ thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
