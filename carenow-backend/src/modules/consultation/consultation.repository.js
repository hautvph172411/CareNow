const pool = require('../../config/database');

exports.create = async (data) => {
  const { patient_name, patient_phone, patient_email, symptoms } = data;
  const result = await pool.query(
    `INSERT INTO tbl_consultation (patient_name, patient_phone, patient_email, symptoms, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [patient_name, patient_phone, patient_email, symptoms, 1]
  );
  return result.rows[0];
};

exports.getAll = async (query = {}) => {
  let sql = 'SELECT * FROM tbl_consultation WHERE 1=1';
  const values = [];
  let idx = 1;

  if (query.status) {
    sql += ` AND status = $${idx++}`;
    values.push(query.status);
  }
  
  if (query.keyword) {
    sql += ` AND (patient_name ILIKE $${idx} OR patient_phone ILIKE $${idx})`;
    values.push(`%${query.keyword}%`);
    idx++;
  }

  sql += ' ORDER BY created_at DESC';

  if (query.limit) {
    sql += ` LIMIT $${idx++}`;
    values.push(query.limit);
  }
  
  if (query.offset) {
    sql += ` OFFSET $${idx++}`;
    values.push(query.offset);
  }

  const result = await pool.query(sql, values);
  return result.rows;
};

exports.count = async (query = {}) => {
  let sql = 'SELECT COUNT(*) FROM tbl_consultation WHERE 1=1';
  const values = [];
  let idx = 1;

  if (query.status) {
    sql += ` AND status = $${idx++}`;
    values.push(query.status);
  }

  if (query.keyword) {
    sql += ` AND (patient_name ILIKE $${idx} OR patient_phone ILIKE $${idx})`;
    values.push(`%${query.keyword}%`);
    idx++;
  }

  const result = await pool.query(sql, values);
  return parseInt(result.rows[0].count, 10);
};

exports.findById = async (id) => {
  const result = await pool.query('SELECT * FROM tbl_consultation WHERE id = $1', [id]);
  return result.rows[0] || null;
};

exports.updateStatus = async (id, status) => {
  const result = await pool.query(
    'UPDATE tbl_consultation SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
};

exports.delete = async (id) => {
  const result = await pool.query('DELETE FROM tbl_consultation WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};
