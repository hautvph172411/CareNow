const pool = require('../../config/database');

/* ── Sinh booking_code: BK + YYMMDD + zero-padded id ──────────────────────── */
function buildBookingCode(id) {
  const now = new Date();
  const yy  = String(now.getFullYear()).slice(2);
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const dd  = String(now.getDate()).padStart(2, '0');
  return `BK${yy}${mm}${dd}${String(id).padStart(4, '0')}`;
}

/* ── Tạo lịch hẹn mới ─────────────────────────────────────────────────────── */
exports.create = async (data) => {
  const ALLOWED = [
    'id', 'booking_code',
    'clinic_id', 'clinic_place_id', 'specialist_id', 'service_id',
    'schedule_block_id', 'price_package_id', 'insurance_package_id',
    'appt_date', 'appt_time', 'session_type', 'status',
    'patient_id', 'patient_name', 'patient_phone', 'patient_email',
    'patient_address', 'patient_notes', 'admin_notes', 'amount_vnd',
  ];

  const { rows: [{ id }] } = await pool.query(
    "SELECT nextval(pg_get_serial_sequence('tbl_appointment', 'id')) AS id"
  );
  const insertData = {
    ...data,
    id,
    booking_code: buildBookingCode(id),
  };

  const fields = ALLOWED.filter((k) => insertData[k] !== undefined);
  const values = fields.map((k) => insertData[k]);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

  const insertSql = `
    INSERT INTO tbl_appointment (${fields.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;

  const { rows: [appt] } = await pool.query(insertSql, values);
  return appt;
};

/* ── Lấy danh sách (admin) ─────────────────────────────────────────────────── */
exports.getAll = async (query = {}) => {
  let q = `
    SELECT
      a.*,
      c.name  AS clinic_name,
      cp.name AS place_name,
      cs.name AS specialist_name,
      sv.name AS service_name,
      pp.name AS price_package_name,
      ip.name AS insurance_package_name
    FROM tbl_appointment a
    LEFT JOIN tbl_clinic           c  ON c.id  = a.clinic_id
    LEFT JOIN tbl_clinic_place     cp ON cp.id = a.clinic_place_id
    LEFT JOIN tbl_clinic_specialist cs ON cs.id = a.specialist_id
    LEFT JOIN tbl_service          sv ON sv.id = a.service_id
    LEFT JOIN tbl_clinic_price_package pp ON pp.id = a.price_package_id
    LEFT JOIN tbl_clinic_insurance_package ip ON ip.id = a.insurance_package_id
    WHERE 1=1
  `;
  const values = [];
  let idx = 1;

  if (query.patient_id) {
    q += ` AND a.patient_id = $${idx++}`;
    values.push(query.patient_id);
  }
  if (query.clinic_id) {
    q += ` AND a.clinic_id = $${idx++}`;
    values.push(query.clinic_id);
  }
  if (query.status !== undefined && query.status !== '') {
    q += ` AND a.status = $${idx++}`;
    values.push(query.status);
  }
  if (query.appt_date) {
    q += ` AND a.appt_date = $${idx++}`;
    values.push(query.appt_date);
  }
  if (query.booking_code) {
    q += ` AND a.booking_code ILIKE $${idx++}`;
    values.push(`%${query.booking_code}%`);
  }
  if (query.keyword) {
    const keyword = String(query.keyword).trim();
    const normalizedId = keyword.replace(/^#/, '');
    if (/^\d+$/.test(normalizedId)) {
      q += ` AND (a.id = $${idx} OR a.booking_code ILIKE $${idx + 1} OR a.patient_name ILIKE $${idx + 1} OR a.patient_phone ILIKE $${idx + 1})`;
      values.push(Number(normalizedId), `%${keyword}%`);
      idx += 2;
    } else {
      q += ` AND (a.booking_code ILIKE $${idx} OR a.patient_name ILIKE $${idx} OR a.patient_phone ILIKE $${idx})`;
      values.push(`%${keyword}%`);
      idx++;
    }
  }
  if (query.clinic_place_id) {
    q += ` AND a.clinic_place_id = $${idx++}`;
    values.push(query.clinic_place_id);
  }
  if (query.specialist_id) {
    q += ` AND a.specialist_id = $${idx++}`;
    values.push(query.specialist_id);
  }

  q += ' ORDER BY a.appt_date DESC, a.appt_time ASC, a.id DESC';

  if (query.limit) {
    q += ` LIMIT $${idx++}`;
    values.push(Number(query.limit));
  }
  if (query.offset !== undefined) {
    q += ` OFFSET $${idx++}`;
    values.push(Number(query.offset));
  }

  const { rows } = await pool.query(q, values);
  return rows;
};

/* ── Đếm (để phân trang admin) ────────────────────────────────────────────── */
exports.count = async (query = {}) => {
  let q = 'SELECT COUNT(*) FROM tbl_appointment a WHERE 1=1';
  const values = [];
  let idx = 1;

  if (query.patient_id) {
    q += ` AND a.patient_id = $${idx++}`;
    values.push(query.patient_id);
  }
  if (query.clinic_id) {
    q += ` AND a.clinic_id = $${idx++}`;
    values.push(query.clinic_id);
  }
  if (query.status !== undefined && query.status !== '') {
    q += ` AND a.status = $${idx++}`;
    values.push(query.status);
  }
  if (query.appt_date) {
    q += ` AND a.appt_date = $${idx++}`;
    values.push(query.appt_date);
  }
  if (query.booking_code) {
    q += ` AND a.booking_code ILIKE $${idx++}`;
    values.push(`%${query.booking_code}%`);
  }
  if (query.keyword) {
    const keyword = String(query.keyword).trim();
    const normalizedId = keyword.replace(/^#/, '');
    if (/^\d+$/.test(normalizedId)) {
      q += ` AND (a.id = $${idx} OR a.booking_code ILIKE $${idx + 1} OR a.patient_name ILIKE $${idx + 1} OR a.patient_phone ILIKE $${idx + 1})`;
      values.push(Number(normalizedId), `%${keyword}%`);
      idx += 2;
    } else {
      q += ` AND (a.booking_code ILIKE $${idx} OR a.patient_name ILIKE $${idx} OR a.patient_phone ILIKE $${idx})`;
      values.push(`%${keyword}%`);
      idx++;
    }
  }
  if (query.clinic_place_id) {
    q += ` AND a.clinic_place_id = $${idx++}`;
    values.push(query.clinic_place_id);
  }
  if (query.specialist_id) {
    q += ` AND a.specialist_id = $${idx++}`;
    values.push(query.specialist_id);
  }

  const { rows } = await pool.query(q, values);
  return parseInt(rows[0].count, 10);
};

/* ── Lịch hẹn của 1 user (cho trang "Lịch của tôi") ─────────────────────── */
exports.getByPatientId = async (patientId, query = {}) => {
  let q = `
    SELECT
      a.*,
      c.name    AS clinic_name,
      c.picture AS clinic_picture,
      cp.name   AS place_name,
      cp.address AS place_address,
      cs.name   AS specialist_name,
      cs.title  AS specialist_title,
      cs.picture AS specialist_picture,
      sv.name   AS service_name,
      pp.name   AS price_package_name,
      ip.name   AS insurance_package_name
    FROM tbl_appointment a
    LEFT JOIN tbl_clinic            c  ON c.id  = a.clinic_id
    LEFT JOIN tbl_clinic_place      cp ON cp.id = a.clinic_place_id
    LEFT JOIN tbl_clinic_specialist cs ON cs.id = a.specialist_id
    LEFT JOIN tbl_service           sv ON sv.id = a.service_id
    LEFT JOIN tbl_clinic_price_package pp ON pp.id = a.price_package_id
    LEFT JOIN tbl_clinic_insurance_package ip ON ip.id = a.insurance_package_id
    WHERE a.patient_id = $1
  `;
  const values = [patientId];
  let idx = 2;

  if (query.status !== undefined && query.status !== '') {
    q += ` AND a.status = $${idx++}`;
    values.push(query.status);
  }

  q += ' ORDER BY a.appt_date DESC, a.appt_time ASC, a.id DESC';

  if (query.limit) {
    q += ` LIMIT $${idx++}`;
    values.push(Number(query.limit));
  }
  if (query.offset !== undefined) {
    q += ` OFFSET $${idx++}`;
    values.push(Number(query.offset));
  }

  const { rows } = await pool.query(q, values);
  return rows;
};

/* ── Lấy chi tiết 1 lịch hẹn ─────────────────────────────────────────────── */
exports.findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT
      a.*,
      c.name    AS clinic_name,
      c.picture AS clinic_picture,
      cp.name   AS place_name,
      cp.address AS place_address,
      cs.name   AS specialist_name,
      cs.title  AS specialist_title,
      cs.picture AS specialist_picture,
      sv.name   AS service_name,
      pp.name   AS price_package_name,
      ip.name   AS insurance_package_name
    FROM tbl_appointment a
    LEFT JOIN tbl_clinic            c  ON c.id  = a.clinic_id
    LEFT JOIN tbl_clinic_place      cp ON cp.id = a.clinic_place_id
    LEFT JOIN tbl_clinic_specialist cs ON cs.id = a.specialist_id
    LEFT JOIN tbl_service           sv ON sv.id = a.service_id
    LEFT JOIN tbl_clinic_price_package pp ON pp.id = a.price_package_id
    LEFT JOIN tbl_clinic_insurance_package ip ON ip.id = a.insurance_package_id
    WHERE a.id = $1`,
    [id]
  );
  return rows[0] || null;
};

/* ── Cập nhật trạng thái ──────────────────────────────────────────────────── */
exports.updateStatus = async (id, status, extraFields = {}) => {
  const setClauses = ['status = $2'];
  const values = [id, status];
  let idx = 3;

  for (const [k, v] of Object.entries(extraFields)) {
    setClauses.push(`${k} = $${idx++}`);
    values.push(v);
  }

  const { rows } = await pool.query(
    `UPDATE tbl_appointment SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  return rows[0] || null;
};

/* ── Cập nhật thông tin lịch hẹn (admin) ─────────────────────────────────── */
exports.update = async (id, data) => {
  const ALLOWED = [
    'clinic_id', 'clinic_place_id', 'specialist_id', 'service_id',
    'schedule_block_id', 'price_package_id', 'insurance_package_id',
    'appt_date', 'appt_time', 'session_type', 'status',
    'patient_name', 'patient_phone', 'patient_email',
    'patient_address', 'patient_notes', 'admin_notes', 'amount_vnd',
    'cancelled_at',
  ];

  const fields = ALLOWED.filter((k) => data[k] !== undefined);
  if (fields.length === 0) return exports.findById(id);

  const setClauses = fields.map((field, i) => `${field} = $${i + 2}`);
  const values = [id, ...fields.map((field) => data[field])];

  const { rows: [updated] } = await pool.query(
    `UPDATE tbl_appointment SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  return updated || null;
};

/* ── Xóa lịch hẹn (admin) ────────────────────────────────────────────────── */
exports.remove = async (id) => {
  const { rows: [deleted] } = await pool.query(
    'DELETE FROM tbl_appointment WHERE id = $1 RETURNING *',
    [id]
  );
  return deleted || null;
};

/* ── Hủy lịch (status=4, ghi cancelled_at) ───────────────────────────────── */
exports.cancel = async (id) => {
  return exports.updateStatus(id, 4, { cancelled_at: new Date() });
};
