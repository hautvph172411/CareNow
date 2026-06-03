const pool = require('../../config/database');

/** Đếm số lịch hẹn đang tham chiếu đến bác sĩ này */
exports.countAppointments = async (clinicId) => {
  const r = await pool.query(
    'SELECT COUNT(*) FROM tbl_appointment WHERE clinic_id = $1',
    [clinicId]
  );
  return parseInt(r.rows[0].count, 10);
};

exports.getAll = async (query = {}) => {
  let q = `
    SELECT c.*,
      (
        SELECT string_agg(s.name, ', ' ORDER BY s.name)
        FROM tbl_clinic_specialist s
        WHERE s.id::text = ANY(string_to_array(c.specialist_ids, ','))
      ) AS specialist_names
    FROM tbl_clinic c
    WHERE 1=1
  `;
  const values = [];
  let idx = 1;

  if (query.keyword) {
    q += ` AND (name ILIKE $${idx} OR address ILIKE $${idx} OR license ILIKE $${idx})`;
    values.push(`%${query.keyword}%`);
    idx++;
  }
  if (query.status !== undefined && query.status !== '' && query.status !== null) {
    q += ` AND status = $${idx}`;
    values.push(query.status);
    idx++;
  }
  if (query.specialist_id) {
    q += ` AND $${idx} = ANY(STRING_TO_ARRAY(specialist_ids, ','))`;
    values.push(String(query.specialist_id));
    idx++;
  }

  if (query.show_in_root_place !== undefined && query.show_in_root_place !== '' && query.show_in_root_place !== null) {
    q += ` AND show_in_root_place = $${idx}`;
    values.push(query.show_in_root_place);
    idx++;
  }
  if (query.place_id) {
    q += ` AND $${idx} = ANY(STRING_TO_ARRAY(place_ids, ','))`;
    values.push(String(query.place_id));
    idx++;
  }
  if (query.service_id) {
    q += ` AND service = $${idx}`;
    values.push(query.service_id);
    idx++;
  }
  if (query.partner_id) {
    q += ` AND $${idx} = ANY(STRING_TO_ARRAY(partner_ids, ','))`;
    values.push(String(query.partner_id));
    idx++;
  }

  if (query.sort_context === 'place') {
    q += ' ORDER BY sponsor DESC NULLS LAST, show_in_root_place DESC NULLS LAST, rank ASC NULLS LAST, id ASC';
  } else if (query.sort_context === 'specialty') {
    q += ' ORDER BY sponsor DESC NULLS LAST, rank DESC NULLS LAST, id ASC';
  } else if (query.sort_context === 'service') {
    q += ' ORDER BY rank ASC NULLS LAST, id ASC';
  } else {
    q += ' ORDER BY sponsor DESC NULLS LAST, rank DESC NULLS LAST, created_at ASC NULLS LAST, id ASC';
  }

  if (query.limit) {
    q += ` LIMIT $${idx}`;
    values.push(query.limit);
    idx++;
  }
  if (query.offset !== undefined) {
    q += ` OFFSET $${idx}`;
    values.push(query.offset);
    idx++;
  }

  const result = await pool.query(q, values);
  return result.rows;
};

exports.count = async (query = {}) => {
  let q = 'SELECT COUNT(*) FROM tbl_clinic WHERE 1=1';
  const values = [];
  let idx = 1;

  if (query.keyword) {
    q += ` AND (name ILIKE $${idx} OR address ILIKE $${idx} OR license ILIKE $${idx})`;
    values.push(`%${query.keyword}%`);
    idx++;
  }
  if (query.status !== undefined && query.status !== '' && query.status !== null) {
    q += ` AND status = $${idx}`;
    values.push(query.status);
    idx++;
  }
  if (query.specialist_id) {
    q += ` AND $${idx} = ANY(STRING_TO_ARRAY(specialist_ids, ','))`;
    values.push(String(query.specialist_id));
    idx++;
  }
  if (query.show_in_root_place !== undefined && query.show_in_root_place !== '' && query.show_in_root_place !== null) {
    q += ` AND show_in_root_place = $${idx}`;
    values.push(query.show_in_root_place);
    idx++;
  }
  if (query.place_id) {
    q += ` AND $${idx} = ANY(STRING_TO_ARRAY(place_ids, ','))`;
    values.push(String(query.place_id));
    idx++;
  }
  if (query.service_id) {
    q += ` AND service = $${idx}`;
    values.push(query.service_id);
    idx++;
  }

  const result = await pool.query(q, values);
  return parseInt(result.rows[0].count, 10);
};

exports.create = async (data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  
  const query = `INSERT INTO tbl_clinic (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.findById = async (id) => {
  const result = await pool.query('SELECT * FROM tbl_clinic WHERE id = $1', [id]);
  return result.rows[0];
};

exports.update = async (id, data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const assignments = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
  
  const query = `UPDATE tbl_clinic SET ${assignments} WHERE id = $${fields.length + 1} RETURNING *`;
  values.push(id);
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.delete = async (id) => {
  const query = `DELETE FROM tbl_clinic WHERE id = $1 RETURNING id`;
  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
};
