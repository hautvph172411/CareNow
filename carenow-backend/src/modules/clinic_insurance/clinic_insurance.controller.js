const service = require('./clinic_insurance.service');

exports.list = async (req, res) => {
  try {
    const result = await service.getPackages(req.query);
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.detail = async (req, res) => {
  try {
    const data = await service.getPackageDetail(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = await service.createPackage(req.body);
    res.status(201).json({ success: true, data, message: 'Đã tạo gói BH' });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await service.updatePackage(req.params.id, req.body);
    res.json({ success: true, data, message: 'Đã cập nhật' });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await service.deletePackage(req.params.id);
    res.json({ success: true, message: 'Đã xóa' });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.status(400).json({ success: false, message: e.message });
  }
};
