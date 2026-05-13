const service = require('./appointment.service');

/* ── Helper: trả lỗi chuẩn ────────────────────────────────────────────────── */
function handleError(res, err) {
  if (err.message === 'NOT_FOUND')  return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
  if (err.message === 'FORBIDDEN')  return res.status(403).json({ message: 'Bạn không có quyền thao tác lịch hẹn này' });
  if (err.message === 'BAD_INPUT')  return res.status(400).json({ message: err.detail || 'Dữ liệu không hợp lệ' });
  console.error('[appointment]', err);
  return res.status(500).json({ message: err.message || 'Internal server error' });
}

/* ── POST /appointments — user/guest tạo lịch hẹn mới ─────────────────────── */
const createAppointment = async (req, res) => {
  try {
    // req.patient được set bởi softAuthClient nếu có token; null nếu guest
    const patientId = req.patient?.id ?? null;
    const appt = await service.createAppointment(req.body, patientId);
    return res.status(201).json({ message: 'Đặt lịch thành công', data: appt });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ── GET /appointments/my — lịch hẹn của bệnh nhân đang đăng nhập ─────────── */
const getMyAppointments = async (req, res) => {
  try {
    const patientId = req.patient.id;
    const result = await service.getMyAppointments(patientId, req.query);
    return res.status(200).json({ message: 'Success', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ── PATCH /appointments/:id/cancel — bệnh nhân hủy lịch ──────────────────── */
const cancelAppointment = async (req, res) => {
  try {
    const patientId = req.patient?.id ?? null;
    const isAdmin   = req.user?.role === 1;  // admin route dùng req.user
    const appt = await service.cancelAppointment(req.params.id, patientId, isAdmin);
    return res.status(200).json({ message: 'Đã hủy lịch hẹn', data: appt });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ── GET /appointments — admin xem tất cả ─────────────────────────────────── */
const getAllAppointments = async (req, res) => {
  try {
    const result = await service.getAllAppointments(req.query);
    return res.status(200).json({ message: 'Success', ...result });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ── GET /appointments/:id — chi tiết 1 lịch hẹn ─────────────────────────── */
const getAppointmentById = async (req, res) => {
  try {
    const patientId = req.patient?.id ?? null;
    const isAdmin   = req.user?.role === 1;
    const appt = await service.getAppointmentById(req.params.id, patientId, isAdmin);
    return res.status(200).json({ message: 'Success', data: appt });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ── PATCH /appointments/:id/status — admin cập nhật trạng thái ────────────── */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const appt = await service.updateAppointmentStatus(req.params.id, status, admin_notes);
    return res.status(200).json({ message: 'Cập nhật thành công', data: appt });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ── PUT /appointments/:id — admin sửa thông tin lịch hẹn ────────────────── */
const updateAppointment = async (req, res) => {
  try {
    const appt = await service.updateAppointment(req.params.id, req.body);
    return res.status(200).json({ message: 'Cập nhật thành công', data: appt });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ── DELETE /appointments/:id — admin xóa lịch hẹn ───────────────────────── */
const deleteAppointment = async (req, res) => {
  try {
    const appt = await service.deleteAppointment(req.params.id);
    return res.status(200).json({ message: 'Xóa lịch hẹn thành công', data: appt });
  } catch (err) {
    return handleError(res, err);
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  updateAppointment,
  deleteAppointment,
};
