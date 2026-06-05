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
  const formatted = formatAppointment(appt);

  // Send confirmation email synchronously so we can return its status
  let emailSent = false;
  if (appt.booking_code && appt.patient_email) {
    try {
      const emailService = require('../notification/email.service');
      const fullAppt = await repository.findByBookingCode(appt.booking_code);
      if (fullAppt) {
        const result = await emailService.sendAppointmentConfirmation(fullAppt);
        emailSent = result.sent;
      }
    } catch (err) {
      console.error('Failed to send confirmation email:', err);
    }
  }

  return { ...formatted, email_sent: emailSent };
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
  if (!isAdmin && Number(appt.patient_id) !== Number(requesterId)) {
    throw new Error('FORBIDDEN');
  }
  return formatAppointment(appt);
};

/* ── Chi tiết Hướng dẫn đi khám (công khai qua link) ─────────────────────── */
const getVisitGuideByBookingCode = async (bookingCode) => {
  if (!bookingCode) throw new Error('NOT_FOUND');
  const appt = await repository.findByBookingCode(bookingCode);
  if (!appt) throw new Error('NOT_FOUND');

  // Xác định bác sĩ khám thực tế (specialist_name ưu tiên, fallback clinic_name)
  const doctorName = appt.specialist_name || appt.clinic_name || '';

  // Xác định nơi khám (place_name + address)
  const placeName    = appt.place_name || '';
  const placeAddress = appt.place_address || '';
  const placeDisplay = [placeName, placeAddress].filter(Boolean).join(' - ');

  // Thay thế các placeholder trong patient_guide
  let processedGuide = appt.place_patient_guide || '';
  if (processedGuide) {
    // {{bac_si}} → tên bác sĩ thực tế
    if (doctorName) {
      processedGuide = processedGuide.replace(
        /\{\{bac_si\}\}/gi,
        `<strong>${doctorName}</strong>`
      );
    }
    // {{noi_kham}} → tên nơi khám + địa chỉ
    if (placeDisplay) {
      processedGuide = processedGuide.replace(
        /\{\{noi_kham\}\}/gi,
        `<strong>${placeDisplay}</strong>`
      );
    }
  }

  const result = formatAppointment(appt);
  result.place_patient_guide = processedGuide;
  result.doctor_name = doctorName;
  return result;
};

/* ── Bệnh nhân hủy lịch ─────────────────────────────────────────────────── */
const cancelAppointment = async (id, requesterId, isAdmin, cancelReason = '') => {
  const appt = await repository.findById(id);
  if (!appt) throw new Error('NOT_FOUND');

  if (!isAdmin && Number(appt.patient_id) !== Number(requesterId)) {
    throw new Error('FORBIDDEN');
  }
  if ([3, 4, 5].includes(appt.status)) {
    throw Object.assign(new Error('BAD_INPUT'), {
      detail: 'Lịch hẹn này đã kết thúc hoặc đã hủy, không thể hủy lại.',
    });
  }

  const reason = String(cancelReason || '').trim();
  if (!isAdmin && !reason) {
    throw Object.assign(new Error('BAD_INPUT'), { detail: 'Vui lòng nhập lý do hủy lịch.' });
  }
  const marker = reason
    ? `[CANCEL_REASON][PATIENT][${new Date().toLocaleString('vi-VN')}] ${reason}`
    : null;
  const adminNotes = marker ? [appt.admin_notes, marker].filter(Boolean).join('\n') : appt.admin_notes;
  const updated = await repository.updateStatus(id, 4, {
    cancelled_at: new Date(),
    ...(marker ? { admin_notes: adminNotes } : {}),
  });
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

/* ── Nhận lại các lịch guest vào bệnh nhân sau khi đăng nhập ─────────────── */
const claimLocalAppointments = async (patientId, bookingCodes = []) => {
  if (!patientId) {
    throw Object.assign(new Error('BAD_INPUT'), { detail: 'patientId là bắt buộc' });
  }
  const appts = await repository.claimGuestBookings({ patientId, bookingCodes });
  return appts.map(formatAppointment);
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
  claimLocalAppointments,
  getAllAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointmentStatus,
  updateAppointment,
  deleteAppointment,
  getVisitGuideByBookingCode,
};
