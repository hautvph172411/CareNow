const pool = require('../../config/database');

exports.getAll = async (query = {}) => {
  let q = `SELECT * FROM tbl_partner WHERE 1=1`;
  const values = [];
  let idx = 1;

  if (query.keyword) {
    q += ` AND (name ILIKE $${idx} OR short_name ILIKE $${idx} OR address ILIKE $${idx})`;
    values.push(`%${query.keyword}%`);
    idx++;
  }

  q += ' ORDER BY rank ASC, id DESC';

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
  let q = 'SELECT COUNT(*) FROM tbl_partner WHERE 1=1';
  const values = [];
  let idx = 1;

  if (query.keyword) {
    q += ` AND (name ILIKE $${idx} OR short_name ILIKE $${idx} OR address ILIKE $${idx})`;
    values.push(`%${query.keyword}%`);
    idx++;
  }

  const result = await pool.query(q, values);
  return parseInt(result.rows[0].count, 10);
};

exports.findById = async (id) => {
  const result = await pool.query('SELECT * FROM tbl_partner WHERE id = $1', [id]);
  return result.rows[0];
};

exports.create = async (data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

  const query = `INSERT INTO tbl_partner (${fields.map(f => `"${f}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.update = async (id, data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const assignments = fields.map((field, i) => `"${field}" = $${i + 1}`).join(', ');

  const query = `UPDATE tbl_partner SET ${assignments} WHERE id = $${fields.length + 1} RETURNING *`;
  values.push(id);
  const result = await pool.query(query, values);
  return result.rows[0];
};

exports.delete = async (id) => {
  const query = 'DELETE FROM tbl_partner WHERE id = $1 RETURNING id';
  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
};
