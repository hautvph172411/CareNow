const repository = require('./appointment.repository');

/* ── Normalize: '' | undefined | null  →  null, chuỗi số → số ────────────── */
const toInt = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};

/* ── Mapping status code → text (dùng cho response) ──────────────────────── */
const STATUS_LABEL = {
  1: 'pending',
  2: 'confirmed',
  3: 'completed',
  4: 'cancelled_user',
  5: 'cancelled_clinic',
  6: 'no_show',
};

/* ── Tạo lịch hẹn mới ─────────────────────────────────────────────────────── */
const createAppointment = async (payload, patientId = null) => {
  const { patient_name, patient_phone, appt_date, appt_time } = payload;

  if (!patient_name || !String(patient_name).trim()) {
    throw Object.assign(new Error('BAD_INPUT'), { detail: 'patient_name là bắt buộc' });
  }
  if (!patient_phone || !String(patient_phone).trim()) {
    throw Object.assign(new Error('BAD_INPUT'), { detail: 'patient_phone là bắt buộc' });
  }
  if (!appt_date) {
    throw Object.assign(new Error('BAD_INPUT'), { detail: 'appt_date là bắt buộc' });
  }
  if (!appt_time) {
    throw Object.assign(new Error('BAD_INPUT'), { detail: 'appt_time là bắt buộc' });
  }

  // Không cho đặt ngày trong quá khứ
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const chosen = new Date(appt_date);
  if (chosen < today) {
    throw Object.assign(new Error('BAD_INPUT'), { detail: 'Ngày khám phải từ hôm nay trở đi' });
  }

  const data = {
    clinic_id:            toInt(payload.clinic_id),
    clinic_place_id:      toInt(payload.clinic_place_id),
    specialist_id:        toInt(payload.specialist_id),
    service_id:           toInt(payload.service_id),
    schedule_block_id:    toInt(payload.schedule_block_id),
    price_package_id:     toInt(payload.price_package_id),
    insurance_package_id: toInt(payload.insurance_package_id),
    appt_date,
    appt_time,
    session_type:         toInt(payload.session_type) || 1,
    status:               1,  // luôn bắt đầu với trạng thái pending
    patient_id:           patientId,
    patient_name:         String(patient_name).trim(),
    patient_phone:        String(patient_phone).trim(),
    patient_email:        payload.patient_email   || null,
    patient_address:      payload.patient_address || null,
    patient_notes:        payload.patient_notes   || null,
    amount_vnd:           payload.amount_vnd ? toInt(payload.amount_vnd) : null,
  };

  // Bỏ các key null khỏi data (để DB dùng DEFAULT)
  Object.keys(data).forEach((k) => {
    if (data[k] === null) delete data[k];
  });

  // patient_id luôn phải được đặt (kể cả NULL để hỗ trợ guest)
  data.patient_id = patientId;

  const appt = await repository.create(data);
  return formatAppointment(appt);
};

/* ── Lịch sử / sắp tới của bệnh nhân ────────────────────────────────────── */
const getMyAppointments = async (patientId, query = {}) => {
  const limit  = query.limit  ? parseInt(query.limit)  : 20;
  const page   = query.page   ? parseInt(query.page)   : 1;
  const offset = (page - 1) * limit;

  const rows = await repository.getByPatientId(patientId, {
    status: query.status,
    limit,
    offset,
  });

  return rows.map(formatAppointment);
};

/* ── Admin: danh sách tất cả ─────────────────────────────────────────────── */
const getAllAppointments = async (query = {}) => {
  const limit  = query.limit  ? parseInt(query.limit)  : 20;
  const page   = query.page   ? parseInt(query.page)   : 1;
  const offset = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    repository.getAll({ ...query, limit, offset }),
    repository.count(query),
  ]);

  return {
    data: rows.map(formatAppointment),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

/* ── Chi tiết 1 lịch hẹn ─────────────────────────────────────────────────── */
const getAppointmentById = async (id, requesterId, isAdmin) => {
  const appt = await repository.findById(id);
  if (!appt) throw new Error('NOT_FOUND');

  // Chỉ owner hoặc admin được xem
  if (!isAdmin && appt.patient_id !== requesterId) {
    throw new Error('FORBIDDEN');
  }
  return formatAppointment(appt);
};

/* ── Bệnh nhân hủy lịch ─────────────────────────────────────────────────── */
const cancelAppointment = async (id, requesterId, isAdmin) => {
  const appt = await repository.findById(id);
  if (!appt) throw new Error('NOT_FOUND');

  if (!isAdmin && appt.patient_id !== requesterId) {
    throw new Error('FORBIDDEN');
  }
  if ([3, 4, 5].includes(appt.status)) {
    throw Object.assign(new Error('BAD_INPUT'), {
      detail: 'Lịch hẹn này đã kết thúc hoặc đã hủy, không thể hủy lại.',
    });
  }

  const updated = await repository.cancel(id);
  return formatAppointment(updated);
};

/* ── Admin cập nhật trạng thái ───────────────────────────────────────────── */
const updateAppointmentStatus = async (id, status, adminNotes) => {
  const allowed = [1, 2, 3, 4, 5, 6];
  if (!allowed.includes(Number(status))) {
    throw Object.assign(new Error('BAD_INPUT'), { detail: 'status không hợp lệ (1–6)' });
  }

  const appt = await repository.findById(id);
  if (!appt) throw new Error('NOT_FOUND');

  const extra = {};
  if (adminNotes !== undefined) extra.admin_notes = adminNotes;
  if (Number(status) === 4 || Number(status) === 5) extra.cancelled_at = new Date();

  const updated = await repository.updateStatus(id, Number(status), extra);
  return formatAppointment(updated);
};

/* ── Admin cập nhật toàn bộ thông tin lịch hẹn ───────────────────────────── */
const updateAppointment = async (id, payload = {}) => {
  const appt = await repository.findById(id);
  if (!appt) throw new Error('NOT_FOUND');

  if (payload.patient_name !== undefined && !String(payload.patient_name).trim()) {
    throw Object.assign(new Error('BAD_INPUT'), { detail: 'patient_name là bắt buộc' });
  }
  if (payload.patient_phone !== undefined && !String(payload.patient_phone).trim()) {
    throw Object.assign(new Error('BAD_INPUT'), { detail: 'patient_phone là bắt buộc' });
  }
  if (payload.status !== undefined && ![1, 2, 3, 4, 5, 6].includes(Number(payload.status))) {
    throw Object.assign(new Error('BAD_INPUT'), { detail: 'status không hợp lệ (1–6)' });
  }

  const data = {
    clinic_id:            toInt(payload.clinic_id),
    clinic_place_id:      toInt(payload.clinic_place_id),
    specialist_id:        toInt(payload.specialist_id),
    service_id:           toInt(payload.service_id),
    schedule_block_id:    toInt(payload.schedule_block_id),
    price_package_id:     toInt(payload.price_package_id),
    insurance_package_id: toInt(payload.insurance_package_id),
    session_type:         payload.session_type !== undefined ? toInt(payload.session_type) : undefined,
    status:               payload.status !== undefined ? Number(payload.status) : undefined,
    amount_vnd:           payload.amount_vnd !== undefined && payload.amount_vnd !== '' ? toInt(payload.amount_vnd) : undefined,
    appt_date:            payload.appt_date,
    appt_time:            payload.appt_time,
    patient_name:         payload.patient_name !== undefined ? String(payload.patient_name).trim() : undefined,
    patient_phone:        payload.patient_phone !== undefined ? String(payload.patient_phone).trim() : undefined,
    patient_email:        payload.patient_email === '' ? null : payload.patient_email,
    patient_address:      payload.patient_address === '' ? null : payload.patient_address,
    patient_notes:        payload.patient_notes === '' ? null : payload.patient_notes,
    admin_notes:          payload.admin_notes === '' ? null : payload.admin_notes,
  };

  Object.keys(data).forEach((key) => {
    if (data[key] === undefined) delete data[key];
  });

  if (data.status === 4 || data.status === 5) {
    data.cancelled_at = new Date();
  }

  const updated = await repository.update(id, data);
  if (!updated) throw new Error('NOT_FOUND');
  return formatAppointment(updated);
};

/* ── Admin xóa lịch hẹn ─────────────────────────────────────────────────── */
const deleteAppointment = async (id) => {
  const deleted = await repository.remove(id);
  if (!deleted) throw new Error('NOT_FOUND');
  return formatAppointment(deleted);
};

/* ── Format row → response object ────────────────────────────────────────── */
function formatAppointment(row) {
  if (!row) return null;
  return {
    ...row,
    status_label: STATUS_LABEL[row.status] || 'unknown',
  };
}

module.exports = {
  createAppointment,
  getMyAppointments,
  getAllAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointmentStatus,
  updateAppointment,
  deleteAppointment,
};
