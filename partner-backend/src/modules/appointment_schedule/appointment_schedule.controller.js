const service = require('./appointment_schedule.service');

exports.listBlocks = async (req, res) => {
  try {
    const query = { ...req.query };
    if (req.user?.partner_id) {
      query.partner_id = req.user.partner_id;
    }
    const result = await service.getBlocks(query);
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.getBlock = async (req, res) => {
  try {
    const partnerId = req.user?.partner_id ?? null;
    const data = await service.getBlockById(req.params.id, partnerId);
    res.json({ success: true, data });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.createBlock = async (req, res) => {
  try {
    const partnerId = req.user?.partner_id ?? null;
    const data = await service.createBlock(req.body, partnerId, req.user);
    res.status(201).json({ success: true, data, message: 'Tạo khung lịch thành công' });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.updateBlock = async (req, res) => {
  try {
    const partnerId = req.user?.partner_id ?? null;
    const data = await service.updateBlock(req.params.id, req.body, partnerId, req.user);
    res.json({ success: true, data, message: 'Cập nhật thành công' });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    if (e.message === 'FORBIDDEN') return res.status(403).json({ success: false, message: 'Không có quyền' });
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteBlock = async (req, res) => {
  try {
    const partnerId = req.user?.partner_id ?? null;
    await service.deleteBlock(req.params.id, partnerId, req.user);
    res.json({ success: true, message: 'Đã xóa' });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    if (e.message === 'FORBIDDEN') return res.status(403).json({ success: false, message: 'Không có quyền' });
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.listPricePackages = async (req, res) => {
  try {
    const data = await service.listPricePackages(req.query.clinic_id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.listInsurancePackages = async (req, res) => {
  try {
    const data = await service.listInsurancePackages(req.query.clinic_id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.listOverrides = async (req, res) => {
  try {
    const query = { ...req.query };
    if (req.user?.partner_id) {
      query.partner_id = req.user.partner_id;
    }
    const data = await service.getOverrides(query);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.createOverride = async (req, res) => {
  try {
    const partnerId = req.user?.partner_id ?? null;
    const data = await service.createOverride(req.body, partnerId);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteOverride = async (req, res) => {
  try {
    const partnerId = req.user?.partner_id ?? null;
    await service.deleteOverride(req.params.id, partnerId);
    res.json({ success: true, message: 'Đã xóa' });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    if (e.message === 'FORBIDDEN') return res.status(403).json({ success: false, message: 'Không có quyền' });
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const data = await service.getLogs(req.query);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};
