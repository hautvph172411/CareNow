const partnerService = require('./partner.service');

exports.getPartners = async (req, res) => {
  try {
    const result = await partnerService.getPartners(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPartnerById = async (req, res) => {
  try {
    const data = await partnerService.getPartnerById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy đối tác' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPartner = async (req, res) => {
  try {
    const data = await partnerService.createPartner(req.body);
    res.status(201).json({ success: true, data, message: 'Thêm đối tác thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updatePartner = async (req, res) => {
  try {
    const data = await partnerService.updatePartner(req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật đối tác thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deletePartner = async (req, res) => {
  try {
    const success = await partnerService.deletePartner(req.params.id);
    if (!success) return res.status(404).json({ success: false, message: 'Không tìm thấy đối tác' });
    res.json({ success: true, message: 'Xóa đối tác thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
