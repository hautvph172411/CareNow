const db = require('../../config/database');

exports.getAll = async () => {
  const result = await db.query(`
    SELECT 
      d.id, d.name, d.specialty, d.phone, d.email,
      d.description, d.image, d.status, d.created_at,
      d.clinic_id,
      c.name AS clinic_name
    FROM tbl_doctor d
    LEFT JOIN tbl_clinic c ON d.clinic_id = c.id
    ORDER BY d.created_at DESC
  `);
  return result.rows;
};

exports.findById = async (id) => {
  const result = await db.query(
    `SELECT d.*, c.name AS clinic_name
     FROM tbl_doctor d
     LEFT JOIN tbl_clinic c ON d.clinic_id = c.id
     WHERE d.id = $1`,
    [id]
  );
  return result.rows[0];
};

exports.create = async (data) => {
  const result = await db.query(`
    INSERT INTO tbl_doctor
      (name, specialty, phone, email, description, image, clinic_id, status, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `, [
    data.name,
    data.specialty,
    data.phone || null,
    data.email || null,
    data.description || null,
    data.image || null,
    data.clinic_id || null,
    data.status !== undefined ? data.status : 1,
    Math.floor(Date.now() / 1000),
  ]);
  return result.rows[0];
};

exports.update = async (id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const allowed = ['name', 'specialty', 'phone', 'email', 'description', 'image', 'clinic_id', 'status'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await db.query(
    `UPDATE tbl_doctor SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0];
};

exports.remove = async (id) => {
  const result = await db.query(
    'DELETE FROM tbl_doctor WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};
