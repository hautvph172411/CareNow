const pool = require('../../config/database');

const BLOCK_SELECT = `
  SELECT b.*,
    c.name AS clinic_name,
    p.name AS partner_name,
    pl.name AS place_name,
    COALESCE(sc.cnt, 0)::int AS specialist_count
  FROM tbl_appt_schedule_block b
  LEFT JOIN tbl_clinic c ON c.id = b.clinic_id
  LEFT JOIN tbl_partner p ON p.id = b.partner_id
  LEFT JOIN tbl_clinic_place pl ON pl.id = b.clinic_place_id
  LEFT JOIN (
    SELECT schedule_block_id, COUNT(*)::int AS cnt
    FROM tbl_appt_schedule_block_specialist
    GROUP BY schedule_block_id
  ) sc ON sc.schedule_block_id = b.id
`;

exports.findAllBlocks = async (query = {}) => {
  let q = `${BLOCK_SELECT} WHERE 1=1`;
  const values = [];
  let i = 1;

  if (query.clinic_id) {
    q += ` AND b.clinic_id = $${i++}`;
    values.push(query.clinic_id);
  }
  if (query.partner_id) {
    q += ` AND b.partner_id = $${i++}`;
    values.push(query.partner_id);
  }
  if (query.clinic_place_id) {
    q += ` AND b.clinic_place_id = $${i++}`;
    values.push(query.clinic_place_id);
  }
  if (query.status !== undefined && query.status !== '') {
    q += ` AND b.status = $${i++}`;
    values.push(query.status);
  }
  if (query.day_of_week !== undefined && query.day_of_week !== '') {
    q += ` AND b.day_of_week = $${i++}`;
    values.push(query.day_of_week);
  }

  q += ' ORDER BY b.clinic_id, b.day_of_week, b.session_type, b.start_time, b.id';

  if (query.limit) {
    q += ` LIMIT $${i++}`;
    values.push(query.limit);
  }
  if (query.offset !== undefined) {
    q += ` OFFSET $${i++}`;
    values.push(query.offset);
  }

  const result = await pool.query(q, values);
  return result.rows;
};

exports.countBlocks = async (query = {}) => {
  let q = 'SELECT COUNT(*) FROM tbl_appt_schedule_block b WHERE 1=1';
  const values = [];
  let i = 1;

  if (query.clinic_id) {
    q += ` AND b.clinic_id = $${i++}`;
    values.push(query.clinic_id);
  }
  if (query.partner_id) {
    q += ` AND b.partner_id = $${i++}`;
    values.push(query.partner_id);
  }
  if (query.clinic_place_id) {
    q += ` AND b.clinic_place_id = $${i++}`;
    values.push(query.clinic_place_id);
  }
  if (query.status !== undefined && query.status !== '') {
    q += ` AND b.status = $${i++}`;
    values.push(query.status);
  }

  const result = await pool.query(q, values);
  return parseInt(result.rows[0].count, 10);
};

exports.findBlockById = async (id) => {
  const result = await pool.query(`${BLOCK_SELECT} WHERE b.id = $1`, [id]);
  return result.rows[0];
};

exports.listSpecialistIdsForBlock = async (scheduleBlockId) => {
  const result = await pool.query(
    'SELECT specialist_id FROM tbl_appt_schedule_block_specialist WHERE schedule_block_id = $1 ORDER BY specialist_id',
    [scheduleBlockId]
  );
  return result.rows.map((r) => r.specialist_id);
};

exports.insertBlock = async (payload) => {
  const fields = Object.keys(payload);
  const values = Object.values(payload);
  const ph = fields.map((_, idx) => `$${idx + 1}`).join(', ');
  const q = `INSERT INTO tbl_appt_schedule_block (${fields.join(', ')}) VALUES (${ph}) RETURNING *`;
  const result = await pool.query(q, values);
  return result.rows[0];
};

exports.updateBlock = async (id, payload) => {
  const fields = Object.keys(payload);
  const values = Object.values(payload);
  if (fields.length === 0) return null;
  const setClause = fields.map((k, idx) => `${k} = $${idx + 1}`).join(', ');
  values.push(id);
  const q = `UPDATE tbl_appt_schedule_block SET ${setClause} WHERE id = $${values.length} RETURNING *`;
  const result = await pool.query(q, values);
  return result.rows[0];
};

exports.deleteBlock = async (id) => {
  const result = await pool.query('DELETE FROM tbl_appt_schedule_block WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
};

exports.replaceBlockSpecialists = async (scheduleBlockId, specialistIds) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM tbl_appt_schedule_block_specialist WHERE schedule_block_id = $1', [
      scheduleBlockId,
    ]);
    for (const sid of specialistIds) {
      await client.query(
        'INSERT INTO tbl_appt_schedule_block_specialist (schedule_block_id, specialist_id) VALUES ($1, $2)',
        [scheduleBlockId, sid]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

exports.createBlockWithSpecialists = async (payload, specialistIds) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const fields = Object.keys(payload);
    const values = Object.values(payload);
    const ph = fields.map((_, idx) => `$${idx + 1}`).join(', ');
    const ins = await client.query(
      `INSERT INTO tbl_appt_schedule_block (${fields.join(', ')}) VALUES (${ph}) RETURNING *`,
      values
    );
    const block = ins.rows[0];
    for (const sid of specialistIds) {
      await client.query(
        'INSERT INTO tbl_appt_schedule_block_specialist (schedule_block_id, specialist_id) VALUES ($1, $2)',
        [block.id, sid]
      );
    }
    await client.query('COMMIT');
    return block;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

/** Gói giá / BH để dropdown form */
exports.listPricePackagesByClinic = async (clinicId) => {
  const r = await pool.query(
    `SELECT id, name, status, rank FROM tbl_clinic_price_package WHERE clinic_id = $1 ORDER BY rank ASC, id`,
    [clinicId]
  );
  return r.rows;
};

exports.listInsurancePackagesByClinic = async (clinicId) => {
  const r = await pool.query(
    `SELECT id, name, partner_id, status, rank FROM tbl_clinic_insurance_package WHERE clinic_id = $1 ORDER BY rank ASC, id`,
    [clinicId]
  );
  return r.rows;
};

/** --- Overrides --- */
exports.findAllOverrides = async (query = {}) => {
  let q = `
    SELECT o.*, pl.name AS place_name
    FROM tbl_appt_schedule_day_override o
    LEFT JOIN tbl_clinic_place pl ON pl.id = o.clinic_place_id
    WHERE 1=1
  `;
  const values = [];
  let i = 1;
  if (query.clinic_id) {
    q += ` AND o.clinic_id = $${i++}`;
    values.push(query.clinic_id);
  }
  if (query.clinic_place_id) {
    q += ` AND o.clinic_place_id = $${i++}`;
    values.push(query.clinic_place_id);
  }
  q += ' ORDER BY o.override_date DESC, o.id DESC';
  if (query.limit) {
    q += ` LIMIT $${i++}`;
    values.push(query.limit);
  }
  const r = await pool.query(q, values);
  return r.rows;
};

exports.insertOverride = async (payload) => {
  const fields = Object.keys(payload);
  const values = Object.values(payload);
  const ph = fields.map((_, idx) => `$${idx + 1}`).join(', ');
  const q = `INSERT INTO tbl_appt_schedule_day_override (${fields.join(', ')}) VALUES (${ph}) RETURNING *`;
  const r = await pool.query(q, values);
  return r.rows[0];
};

exports.deleteOverride = async (id) => {
  const r = await pool.query('DELETE FROM tbl_appt_schedule_day_override WHERE id = $1 RETURNING id', [id]);
  return r.rows[0];
};
