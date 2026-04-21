const pool = require('../../config/database');

exports.getAll = async () => {
  const result = await pool.query(`
    SELECT *
    FROM tbl_clinic
    ORDER BY id DESC
  `);
  return result.rows;
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
  // If soft delete:
  // const query = `UPDATE tbl_clinic SET status = 0 WHERE id = $1 RETURNING *`;
  // If hard delete as requested:
  const query = `DELETE FROM tbl_clinic WHERE id = $1 RETURNING id`;
  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
};
