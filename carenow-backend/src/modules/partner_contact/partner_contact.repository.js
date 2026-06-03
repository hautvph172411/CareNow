const pool = require('../../config/database');

exports.create = async (data) => {
  const { contact_name, contact_phone, contact_email, clinic_name, clinic_address, notes } = data;
  const result = await pool.query(
    `INSERT INTO tbl_partner_contact (contact_name, contact_phone, contact_email, clinic_name, clinic_address, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [contact_name, contact_phone, contact_email, clinic_name, clinic_address, notes, 1]
  );
  return result.rows[0];
};

exports.getAll = async (query = {}) => {
  let sql = 'SELECT * FROM tbl_partner_contact WHERE 1=1';
  const values = [];
  let idx = 1;

  if (query.status) {
    sql += ` AND status = $${idx++}`;
    values.push(query.status);
  }
  
  if (query.keyword) {
    sql += ` AND (contact_name ILIKE $${idx} OR contact_phone ILIKE $${idx} OR clinic_name ILIKE $${idx})`;
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
  let sql = 'SELECT COUNT(*) FROM tbl_partner_contact WHERE 1=1';
  const values = [];
  let idx = 1;

  if (query.status) {
    sql += ` AND status = $${idx++}`;
    values.push(query.status);
  }

  if (query.keyword) {
    sql += ` AND (contact_name ILIKE $${idx} OR contact_phone ILIKE $${idx} OR clinic_name ILIKE $${idx})`;
    values.push(`%${query.keyword}%`);
    idx++;
  }

  const result = await pool.query(sql, values);
  return parseInt(result.rows[0].count, 10);
};

exports.findById = async (id) => {
  const result = await pool.query('SELECT * FROM tbl_partner_contact WHERE id = $1', [id]);
  return result.rows[0] || null;
};

exports.updateStatus = async (id, status) => {
  const result = await pool.query(
    'UPDATE tbl_partner_contact SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
};

exports.delete = async (id) => {
  const result = await pool.query('DELETE FROM tbl_partner_contact WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};
