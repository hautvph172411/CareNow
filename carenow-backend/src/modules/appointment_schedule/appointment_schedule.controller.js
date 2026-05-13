const service = require('./appointment_schedule.service');

exports.listBlocks = async (req, res) => {
  try {
    const result = await service.getBlocks(req.query);
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.getBlock = async (req, res) => {
  try {
    const data = await service.getBlockById(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.createBlock = async (req, res) => {
  try {
    const data = await service.createBlock(req.body);
    res.status(201).json({ success: true, data, message: 'Tạo khung lịch thành công' });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.updateBlock = async (req, res) => {
  try {
    const data = await service.updateBlock(req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật thành công' });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteBlock = async (req, res) => {
  try {
    await service.deleteBlock(req.params.id);
    res.json({ success: true, message: 'Đã xóa' });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy' });
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
    const data = await service.getOverrides(req.query);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.createOverride = async (req, res) => {
  try {
    const data = await service.createOverride(req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteOverride = async (req, res) => {
  try {
    await service.deleteOverride(req.params.id);
    res.json({ success: true, message: 'Đã xóa' });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.status(400).json({ success: false, message: e.message });
  }
};
