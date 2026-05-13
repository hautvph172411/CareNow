const pool = require('../../config/database');

const TABLE = 'tbl_service';

const create = async (payload) => {
  const fields = Object.keys(payload);
  const values = Object.values(payload);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
    INSERT INTO ${TABLE} (${fields.join(', ')})
    VALUES (${placeholders})
    RETURNING *;
  `;
  const result = await pool.query(query, values);
  return result.rows[0];
};

const findAll = async (query = {}) => {
  let q = `SELECT * FROM ${TABLE} WHERE 1=1`;
  const values = [];
  let i = 1;

  if (query.status !== undefined && query.status !== '') {
    q += ` AND status = $${i++}`;
    values.push(query.status);
  }
  if (query.keyword) {
    q += ` AND (name ILIKE $${i} OR description ILIKE $${i})`;
    values.push(`%${query.keyword}%`);
    i++;
  }

  q += ' ORDER BY rank DESC NULLS LAST, created_at ASC NULLS LAST, id ASC';

  if (query.limit) {
    q += ` LIMIT $${i++}`;
    values.push(query.limit);
  }
  if (query.offset) {
    q += ` OFFSET $${i++}`;
    values.push(query.offset);
  }

  const result = await pool.query(q, values);
  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
  return result.rows[0];
};

const update = async (id, payload) => {
  const fields = Object.keys(payload);
  const values = Object.values(payload);
  if (fields.length === 0) return null;

  const setClause = fields.map((k, idx) => `${k} = $${idx + 1}`).join(', ');
  values.push(id);

  const result = await pool.query(
    `UPDATE ${TABLE} SET ${setClause} WHERE id = $${values.length} RETURNING *;`,
    values
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(
    `DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

const count = async (query = {}) => {
  let q = `SELECT COUNT(*) FROM ${TABLE} WHERE 1=1`;
  const values = [];
  let i = 1;

  if (query.status !== undefined && query.status !== '') {
    q += ` AND status = $${i++}`;
    values.push(query.status);
  }
  if (query.keyword) {
    q += ` AND (name ILIKE $${i} OR description ILIKE $${i})`;
    values.push(`%${query.keyword}%`);
    i++;
  }

  const result = await pool.query(q, values);
  return parseInt(result.rows[0].count, 10);
};

module.exports = { create, findAll, findById, update, remove, count };
