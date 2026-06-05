let nodemailer = null;
const db = require('../../config/database');
try {
  nodemailer = require('nodemailer');
} catch (_) {
  nodemailer = null;
}

function formatDateVi(dateInput) {
  if (!dateInput) return '-';
  const d = dateInput instanceof Date
    ? dateInput
    : (String(dateInput).length <= 10
      ? new Date(`${String(dateInput)}T00:00:00`)
      : new Date(dateInput));
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function buildAppointmentHtml(appt) {
  const dateText = formatDateVi(appt.appt_date);
  const timeText = appt.appt_time ? String(appt.appt_time).slice(0, 5) : '';
  const doctorName = appt.clinic_name || appt.specialist_name || '-';
  const reason = appt.patient_reason_clean || '-';
  const fullAddress = appt.patient_full_address || appt.patient_address || '-';
  return `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
    <h2 style="margin:0 0 12px">Xác nhận đặt lịch khám thành công</h2>
    <p>Xin chào <b>${appt.patient_name || 'Bạn'}</b>,</p>
    <p>Bạn đã đặt lịch thành công với thông tin sau:</p>
    <ul>
      <li><b>Mã đặt lịch:</b> ${appt.booking_code || ''}</li>
      <li><b>Bác sĩ:</b> ${doctorName}</li>
      <li><b>Ngày khám:</b> ${dateText}</li>
      <li><b>Giờ khám:</b> ${timeText || '-'}</li>
      <li><b>Lý do khám:</b> ${reason}</li>
      <li><b>Địa chỉ:</b> ${fullAddress}</li>
      <li><b>Số điện thoại:</b> ${appt.patient_phone || '-'}</li>
    </ul>
    <p><b><a href="http://localhost:5174/huong-dan-di-kham/${appt.booking_code}" style="color:#2563eb;text-decoration:none">→ Thông tin hướng dẫn đi khám vui lòng click vào đây</a></b></p>
    <p>Vui lòng đến sớm 10-15 phút trước giờ hẹn để làm thủ tục.</p>
    <p>Trân trọng,<br/>CareNow</p>
  </div>
  `;
}

function canSendSmtp() {
  return Boolean(
    nodemailer &&
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.MAIL_FROM
  );
}

function parseLocationIds(notes = '') {
  const raw = String(notes || '');
  const provinceMatch = raw.match(/Tỉnh\/Thành ID:\s*(\d+)/i);
  const wardMatch = raw.match(/Xã\/Phường ID:\s*(\d+)/i);
  return {
    provinceId: provinceMatch ? Number(provinceMatch[1]) : null,
    wardId: wardMatch ? Number(wardMatch[1]) : null,
  };
}

function cleanReason(notes = '') {
  return String(notes || '')
    .replace(/Tỉnh\/Thành ID:\s*\d+/gi, '')
    .replace(/Xã\/Phường ID:\s*\d+/gi, '')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function resolveLocationNames({ provinceId, wardId }) {
  let provinceName = '';
  let wardName = '';
  if (provinceId) {
    const p = await db.query('SELECT name FROM tbl_location_province WHERE id = $1 LIMIT 1', [provinceId]);
    provinceName = p.rows[0]?.name || '';
  }
  if (wardId) {
    const w = await db.query('SELECT name FROM tbl_location_ward WHERE id = $1 LIMIT 1', [wardId]);
    wardName = w.rows[0]?.name || '';
  }
  return { provinceName, wardName };
}

exports.sendAppointmentConfirmation = async (appt) => {
  if (!appt?.patient_email) return { sent: false, reason: 'missing_email' };
  if (!canSendSmtp()) return { sent: false, reason: 'smtp_not_configured' };

  const ids = parseLocationIds(appt.patient_notes);
  const cleanReasonText = cleanReason(appt.patient_notes);
  const { provinceName, wardName } = await resolveLocationNames(ids);
  const fullAddress = [appt.patient_address, wardName, provinceName].filter(Boolean).join(', ');
  const finalAppt = {
    ...appt,
    patient_reason_clean: cleanReasonText,
    patient_full_address: fullAddress,
  };

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: String(process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: appt.patient_email,
    subject: `[CareNow] Xác nhận lịch khám ${appt.booking_code || ''}`,
    text:
      `Xác nhận đặt lịch khám thành công\n` +
      `Mã đặt lịch: ${appt.booking_code || ''}\n` +
      `Bác sĩ: ${appt.clinic_name || appt.specialist_name || '-'}\n` +
      `Ngày khám: ${formatDateVi(appt.appt_date)}\n` +
      `Giờ khám: ${appt.appt_time ? String(appt.appt_time).slice(0, 5) : '-'}\n` +
      `Lý do khám: ${cleanReasonText || '-'}\n` +
      `Địa chỉ: ${fullAddress || appt.patient_address || '-'}\n` +
      `SĐT: ${appt.patient_phone || '-'}\n\n` +
      `Thông tin hướng dẫn đi khám vui lòng click vào đây: http://localhost:5174/huong-dan-di-kham/${appt.booking_code}`,
    html: buildAppointmentHtml(finalAppt),
  });

  return { sent: true };
};
