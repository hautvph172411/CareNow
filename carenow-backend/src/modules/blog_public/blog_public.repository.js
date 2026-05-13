const pool = require('../../config/database');

const TABLE = 'tbl_blog_public';

const column = (field) => (field === 'references' ? '"references"' : field);

const create = async (payload) => {
  const fields = Object.keys(payload);
  const values = Object.values(payload);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const result = await pool.query(
    `INSERT INTO ${TABLE} (${fields.map(column).join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return result.rows[0];
};

const buildWhere = (query = {}) => {
  let where = ' WHERE 1=1';
  const values = [];
  let i = 1;

  if (query.status !== undefined && query.status !== '') {
    where += ` AND bp.status = $${i++}`;
    values.push(query.status);
  }
  if (query.reason) {
    where += ` AND bp.reason = $${i++}`;
    values.push(query.reason);
  }
  if (query.keyword) {
    where += ` AND (bp.title ILIKE $${i} OR bp.summary ILIKE $${i} OR bp.description ILIKE $${i} OR bp.url ILIKE $${i})`;
    values.push(`%${query.keyword}%`);
    i++;
  }

  return { where, values, nextIndex: i };
};

const baseSelect = `
  SELECT
    bp.*,
    cr.name AS reason_name,
    c.name AS suggest_doctor_name,
    s.name AS suggest_specialist_name
  FROM ${TABLE} bp
  LEFT JOIN tbl_clinic_reason cr ON cr.id = bp.reason
  LEFT JOIN tbl_clinic c ON c.id = bp.suggest_doctor
  LEFT JOIN tbl_clinic_specialist s ON s.id = bp.suggest_specialist
`;

const findAll = async (query = {}) => {
  const { where, values, nextIndex } = buildWhere(query);
  let i = nextIndex;
  let sql = `${baseSelect}${where} ORDER BY bp.rank DESC NULLS LAST, bp.updated_time DESC NULLS LAST, bp.id DESC`;

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
  const result = await pool.query(`${baseSelect} WHERE bp.id = $1`, [id]);
  return result.rows[0];
};

const update = async (id, payload) => {
  const fields = Object.keys(payload);
  if (fields.length === 0) return null;

  const values = Object.values(payload);
  const setClause = fields.map((field, idx) => `${column(field)} = $${idx + 1}`).join(', ');
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
  const result = await pool.query(`SELECT COUNT(*) FROM ${TABLE} bp${where}`, values);
  return parseInt(result.rows[0].count, 10);
};

module.exports = { create, findAll, findById, update, remove, count };
