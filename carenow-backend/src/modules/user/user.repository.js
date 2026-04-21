const db = require('../../config/database');

exports.findByUsername = async (username) => {
  const result = await db.query(
    'SELECT * FROM tbl_user WHERE username = $1 LIMIT 1',
    [username]
  );
  return result.rows[0];
};

exports.createUser = async (user) => {
  const query = `
    INSERT INTO tbl_user
    (username, email, phone, password, salt, role, status, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
  `;
  const values = [
    user.username,
    user.email,
    user.phone,
    user.password,
    user.salt,
    user.role,
    user.status,
    user.created_at
  ];

  const result = await db.query(query, values);
  return result.rows[0];
};

exports.getAllUsers = async () => {
  const result = await db.query(
    'SELECT id, username, status, created_at FROM tbl_user'
  );
  return result.rows;
};
