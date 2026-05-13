const db = require('../../config/database');

const PUBLIC_FIELDS = `
  id, google_id, google_email, avatar_url,
  full_name, email, phone, date_of_birth, gender,
  address, province_id, ward_id,
  blood_type, allergies, medical_history, insurance_code,
  emergency_contact_name, emergency_contact_phone,
  is_verified, is_active, last_login_at,
  created_at, updated_at
`;

exports.findById = async (id) => {
  const result = await db.query(
    `SELECT ${PUBLIC_FIELDS} FROM tbl_patient WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0];
};

exports.findByGoogleId = async (googleId) => {
  const result = await db.query(
    `SELECT ${PUBLIC_FIELDS} FROM tbl_patient WHERE google_id = $1 LIMIT 1`,
    [googleId]
  );
  return result.rows[0];
};

exports.findByEmail = async (email) => {
  const result = await db.query(
    `SELECT ${PUBLIC_FIELDS} FROM tbl_patient WHERE email = $1 OR google_email = $1 LIMIT 1`,
    [email]
  );
  return result.rows[0];
};

exports.create = async (data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

  const result = await db.query(
    `INSERT INTO tbl_patient (${fields.join(', ')})
     VALUES (${placeholders})
     RETURNING ${PUBLIC_FIELDS}`,
    values
  );
  return result.rows[0];
};

exports.updateById = async (id, data) => {
  const fields = Object.keys(data);
  if (fields.length === 0) return null;

  const values = Object.values(data);
  const assignments = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  values.push(id);

  const result = await db.query(
    `UPDATE tbl_patient
     SET ${assignments}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${fields.length + 1}
     RETURNING ${PUBLIC_FIELDS}`,
    values
  );
  return result.rows[0];
};

exports.touchLastLogin = async (id) => {
  await db.query(
    'UPDATE tbl_patient SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );
};

exports.getAll = async (query = {}) => {
  let q = `SELECT ${PUBLIC_FIELDS} FROM tbl_patient WHERE 1=1`;
  const values = [];
  let idx = 1;

  if (query.keyword) {
    q += ` AND (full_name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx})`;
    values.push(`%${query.keyword}%`);
    idx++;
  }

  if (query.is_active !== undefined) {
    q += ` AND is_active = $${idx}`;
    values.push(query.is_active === 'true' || query.is_active === true);
    idx++;
  }

  q += ' ORDER BY id DESC';

  const result = await db.query(q, values);
  return result.rows;
};
