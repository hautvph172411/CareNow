const service = require('./clinic_place.service');

exports.getClinicPlaces = async (req, res) => {
  try {
    const query = { ...req.query };
    if (req.user?.partner_id) {
      query.partner_id = req.user.partner_id;
    }
    const result = await service.getClinicPlaces(query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getClinicPlaceParentOptions = async (req, res) => {
  try {
    const data = await service.listParentOptions(req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
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
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cơ sở y tế' });
    }
    if (err.message === 'CLINIC_PLACE_HAS_CHILDREN') {
      return res.status(400).json({ success: false, message: 'Không thể xóa cơ sở y tế vì đang có các cơ sở/khoa phòng con trực thuộc!' });
    }
    if (err.message === 'CLINIC_PLACE_HAS_SCHEDULES') {
      return res.status(400).json({ success: false, message: 'Không thể xóa cơ sở y tế vì đang có lịch khám bệnh đang hoạt động!' });
    }
    if (err.message === 'CLINIC_PLACE_HAS_APPOINTMENTS') {
      return res.status(400).json({ success: false, message: 'Không thể xóa cơ sở y tế vì đang có lịch hẹn khám của bệnh nhân!' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};
