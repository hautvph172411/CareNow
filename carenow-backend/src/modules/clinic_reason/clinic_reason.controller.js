const service = require('./clinic_reason.service');

const handleError = (res, error) => {
  if (error.message === 'NOT_FOUND') return res.status(404).json({ message: 'Không tìm thấy lý do khám' });
  if (error.message === 'NAME_REQUIRED') return res.status(400).json({ message: 'Tên lý do khám không được để trống' });
  if (error.message === 'NO_VALID_FIELDS') return res.status(400).json({ message: 'Không có trường hợp lệ để cập nhật' });
  return res.status(500).json({ message: error.message });
};

const create = async (req, res) => {
  try {
    const data = await service.createClinicReason(req.body);
    res.status(201).json({ message: 'Success', data });
  } catch (e) { handleError(res, e); }
};

const list = async (req, res) => {
  try {
    const result = await service.getClinicReasons(req.query);
    res.status(200).json({ message: 'Success', ...result });
  } catch (e) { handleError(res, e); }
};

const detail = async (req, res) => {
  try {
    const data = await service.getClinicReasonById(req.params.id);
    res.status(200).json({ message: 'Success', data });
  } catch (e) { handleError(res, e); }
};

const update = async (req, res) => {
  try {
    const data = await service.updateClinicReason(req.params.id, req.body);
    res.status(200).json({ message: 'Success', data });
  } catch (e) { handleError(res, e); }
};

const remove = async (req, res) => {
  try {
    await service.deleteClinicReason(req.params.id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (e) { handleError(res, e); }
};

module.exports = { create, list, detail, update, remove };
