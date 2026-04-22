const db = require('../../config/database');

exports.findByUsername = async (identifier) => {
  const result = await db.query(
    'SELECT * FROM tbl_user WHERE (username = $1 OR email = $1) LIMIT 1',
    [identifier]
  );
  return result.rows[0];
};

exports.findById = async (id) => {
  const result = await db.query(
    'SELECT * FROM tbl_user WHERE id = $1 LIMIT 1',
    [id]
  );
  return result.rows[0];
};

exports.createUser = async (user) => {
  const fields = Object.keys(user);
  const values = Object.values(user);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
    INSERT INTO tbl_user (${fields.join(', ')})
    VALUES (${placeholders})
    RETURNING id, username, email, phone, display_name, role, status, partner_id, created_at
  `;

  const result = await db.query(query, values);
  return result.rows[0];
};

exports.updateUser = async (id, data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  if (fields.length === 0) return null;

  const assignments = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  values.push(id);

  const query = `
    UPDATE tbl_user SET ${assignments} 
    WHERE id = $${fields.length + 1} 
    RETURNING id, username, email, phone, display_name, role, status, partner_id, created_at
  `;

  const result = await db.query(query, values);
  return result.rows[0];
};

exports.getAll = async (query = {}) => {
  let q = 'SELECT id, username, email, phone, display_name, role, status, partner_id, created_at FROM tbl_user WHERE status != -1';
  const values = [];
  let idx = 1;

  if (query.role) {
    q += ` AND role = $${idx}`;
    values.push(query.role);
    idx++;
  }

  if (query.keyword) {
    q += ` AND (username ILIKE $${idx} OR display_name ILIKE $${idx} OR email ILIKE $${idx})`;
    values.push(`%${query.keyword}%`);
    idx++;
  }

  if (query.type === 'admin') {
    q += ` AND partner_id IS NULL`;
  } else if (query.type === 'partner') {
    q += ` AND partner_id IS NOT NULL`;
  }

  q += ' ORDER BY id DESC';

  const result = await db.query(q, values);
  return result.rows;
};

exports.remove = async (id) => {
  // Soft delete preferred for users (status = -1 or similar)
  const result = await db.query('UPDATE tbl_user SET status = -1 WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};
