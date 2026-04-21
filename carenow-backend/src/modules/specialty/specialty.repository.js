const pool = require('../../config/database');

const create = async (payload) => {
  const fields = Object.keys(payload);
  const values = Object.values(payload);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
    INSERT INTO tbl_clinic_specialist (${fields.join(', ')})
    VALUES (${placeholders})
    RETURNING *;
  `;
  const result = await pool.query(query, values);
  return result.rows[0];
};

const findAll = async (query = {}) => {
  let q = 'SELECT * FROM tbl_clinic_specialist WHERE 1=1';
  const values = [];
  let count = 1;

  if (query.status !== undefined) {
    q += ` AND status = $${count}`;
    values.push(query.status);
    count++;
  }
  if (query.keyword) {
    q += ` AND (name ILIKE $${count} OR description ILIKE $${count})`;
    values.push(`%${query.keyword}%`);
    count++;
  }

  q += ' ORDER BY rank ASC, id DESC';
  
  if (query.limit) {
    q += ` LIMIT $${count}`;
    values.push(query.limit);
    count++;
  }
  if (query.offset) {
    q += ` OFFSET $${count}`;
    values.push(query.offset);
    count++;
  }

  const result = await pool.query(q, values);
  return result.rows;
};

const findById = async (id) => {
  const query = 'SELECT * FROM tbl_clinic_specialist WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const update = async (id, payload) => {
  const fields = Object.keys(payload);
  const values = Object.values(payload);
  
  if (fields.length === 0) return null;

  const setClause = fields.map((key, index) => `${key} = $${index + 1}`).join(', ');
  values.push(id);

  const query = `
    UPDATE tbl_clinic_specialist
    SET ${setClause}
    WHERE id = $${values.length}
    RETURNING *;
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

const remove = async (id) => {
  const query = 'DELETE FROM tbl_clinic_specialist WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const count = async (query = {}) => {
  let q = 'SELECT COUNT(*) FROM tbl_clinic_specialist WHERE 1=1';
  const values = [];
  let countParam = 1;

  if (query.status !== undefined) {
    q += ` AND status = $${countParam}`;
    values.push(query.status);
    countParam++;
  }
  if (query.keyword) {
    q += ` AND (name ILIKE $${countParam} OR description ILIKE $${countParam})`;
    values.push(`%${query.keyword}%`);
    countParam++;
  }

  const result = await pool.query(q, values);
  return parseInt(result.rows[0].count, 10);
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove,
  count
};
