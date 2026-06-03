const service = require('./consultation.service');

function handleError(res, err) {
  if (err.message === 'NOT_FOUND') return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
  if (err.message === 'BAD_INPUT') return res.status(400).json({ message: err.detail || 'Dữ liệu không hợp lệ' });
  console.error('[consultation]', err);
  return res.status(500).json({ message: 'Internal server error' });
}

exports.create = async (req, res) => {
  try {
    const data = await service.createConsultation(req.body);
    return res.status(201).json({ message: 'Đã gửi yêu cầu tư vấn thành công', data });
  } catch (err) {
    return handleError(res, err);
  }
};

exports.getAll = async (req, res) => {
  try {
    const result = await service.getAllConsultations(req.query);
    return res.status(200).json({ message: 'Success', ...result });
  } catch (err) {
    return handleError(res, err);
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await service.getUnreadCount();
    return res.status(200).json({ message: 'Success', count });
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
    const data = await service.deleteConsultation(req.params.id);
    return res.status(200).json({ message: 'Đã xóa yêu cầu thành công', data });
  } catch (err) {
    return handleError(res, err);
  }
};
