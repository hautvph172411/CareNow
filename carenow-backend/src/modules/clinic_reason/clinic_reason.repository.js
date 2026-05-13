const pool = require('../../config/database');

const TABLE = 'tbl_clinic_reason';

const create = async (payload) => {
  const fields = Object.keys(payload);
  const values = Object.values(payload);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const result = await pool.query(
    `INSERT INTO ${TABLE} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return result.rows[0];
};

const buildWhere = (query = {}) => {
  let where = ' WHERE 1=1';
  const values = [];
  let i = 1;

  if (query.status !== undefined && query.status !== '') {
    where += ` AND cr.status = $${i++}`;
    values.push(query.status);
  }
  if (query.keyword) {
    where += ` AND (cr.name ILIKE $${i} OR cr.title ILIKE $${i} OR cr.description ILIKE $${i})`;
    values.push(`%${query.keyword}%`);
    i++;
  }

  return { where, values, nextIndex: i };
};

const findAll = async (query = {}) => {
  const { where, values, nextIndex } = buildWhere(query);
  let i = nextIndex;
  let sql = `
    SELECT cr.*, cp.name AS place_name
    FROM ${TABLE} cr
    LEFT JOIN tbl_clinic_place cp ON cp.id = cr.place_id
    ${where}
    ORDER BY cr.rank DESC NULLS LAST, cr.updated_at DESC NULLS LAST, cr.id DESC
  `;

  if (query.limit) {
    sql += ` LIMIT $${i++}`;
    values.push(query.limit);
  }
  if (query.offset !== undefined) {
    sql += ` OFFSET $${i++}`;
    values.push(query.offset);
  }

  const result = await pool.query(sql, values);
  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query(
    `
      SELECT cr.*, cp.name AS place_name
      FROM ${TABLE} cr
      LEFT JOIN tbl_clinic_place cp ON cp.id = cr.place_id
      WHERE cr.id = $1
    `,
    [id]
  );
  return result.rows[0];
};

const update = async (id, payload) => {
  const fields = Object.keys(payload);
  if (fields.length === 0) return null;

  const values = Object.values(payload);
  const setClause = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
  values.push(id);

  const result = await pool.query(
    `UPDATE ${TABLE} SET ${setClause} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0];
};

const count = async (query = {}) => {
  const { where, values } = buildWhere(query);
  const result = await pool.query(`SELECT COUNT(*) FROM ${TABLE} cr${where}`, values);
  return parseInt(result.rows[0].count, 10);
};

module.exports = { create, findAll, findById, update, remove, count };
