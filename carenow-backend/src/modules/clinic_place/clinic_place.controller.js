const service = require('./clinic_place.service');

exports.getClinicPlaces = async (req, res) => {
  try {
    const result = await service.getClinicPlaces(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getClinicPlaceById = async (req, res) => {
  try {
    const data = await service.getClinicPlaceById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createClinicPlace = async (req, res) => {
  try {
    const data = await service.createClinicPlace(req.body);
    res.status(201).json({ success: true, data, message: 'Thêm thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateClinicPlace = async (req, res) => {
  try {
    const data = await service.updateClinicPlace(req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật thành công' });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteClinicPlace = async (req, res) => {
  try {
    await service.deleteClinicPlace(req.params.id);
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.status(400).json({ success: false, message: err.message });
  }
};
