const service = require('./partner_contact.service');

function handleError(res, err) {
  if (err.message === 'NOT_FOUND') return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
  if (err.message === 'BAD_INPUT') return res.status(400).json({ message: err.detail || 'Dữ liệu không hợp lệ' });
  console.error('[partner_contact]', err);
  return res.status(500).json({ message: 'Internal server error' });
}

exports.create = async (req, res) => {
  try {
    const data = await service.createPartnerContact(req.body);
    return res.status(201).json({ message: 'Đã gửi thông tin liên hệ thành công', data });
  } catch (err) {
    return handleError(res, err);
  }
};

exports.getAll = async (req, res) => {
  try {
    const result = await service.getAllPartnerContacts(req.query);
    return res.status(200).json({ message: 'Success', ...result });
  } catch (err) {
    return handleError(res, err);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const data = await service.updateStatus(req.params.id, status);
    return res.status(200).json({ message: 'Đã cập nhật trạng thái', data });
  } catch (err) {
    return handleError(res, err);
  }
};

exports.delete = async (req, res) => {
  try {
    const data = await service.deletePartnerContact(req.params.id);
    return res.status(200).json({ message: 'Đã xóa liên hệ thành công', data });
  } catch (err) {
    return handleError(res, err);
  }
};
