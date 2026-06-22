const clinicService = require('./clinic.service');

exports.getClinics = async (req, res) => {
  try {
    const query = { ...req.query };
    if (req.user?.partner_id) {
      query.partner_id = req.user.partner_id;
    }
    const data = await clinicService.getClinics(query);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createClinic = async (req, res) => {
  try {
    const body = { ...req.body };
    // Auto-inject partner_ids from logged-in user
    if (req.user?.partner_id) {
      body.partner_ids = String(req.user.partner_id);
    }
    const data = await clinicService.createClinic(body);
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
    // Validate ownership if partner user
    if (req.user?.partner_id) {
      const existing = await clinicService.getClinicById(req.params.id);
      if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
      const pIds = String(existing.partner_ids || '').split(',').map(s => s.trim());
      if (!pIds.includes(String(req.user.partner_id))) {
        return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa bác sĩ này' });
      }
    }
    const data = await clinicService.updateClinic(req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteClinic = async (req, res) => {
  try {
    // Validate ownership if partner user
    if (req.user?.partner_id) {
      const existing = await clinicService.getClinicById(req.params.id);
      if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
      const pIds = String(existing.partner_ids || '').split(',').map(s => s.trim());
      if (!pIds.includes(String(req.user.partner_id))) {
        return res.status(403).json({ success: false, message: 'Không có quyền xóa bác sĩ này' });
      }
    }
    const success = await clinicService.deleteClinic(req.params.id);
    if (!success) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};
