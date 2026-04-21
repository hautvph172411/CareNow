const repo = require('./user.repository');
const { hashPassword, comparePassword } = require('../../ultis/hash');

exports.register = async (data) => {
  const exists = await repo.findByUsername(data.username);
  if (exists) {
    throw new Error('Username already exists');
  }

  // bcrypt tự sinh salt bên trong, không lưu salt riêng nữa
  const hashedPassword = await hashPassword(data.password);

  return repo.createUser({
    username: data.username,
    email: data.email,
    phone: data.phone,
    password: hashedPassword,
    salt: null,              // không dùng nữa, giữ null
    role: data.role ?? 0,   // 0 = user, 1 = admin
    status: 1,
    created_at: Math.floor(Date.now() / 1000)
  });
};

exports.login = async (username, password) => {
  const user = await repo.findByUsername(username);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};


exports.deleteUser = async (id) => {
  const result = await db.query(
    "DELETE FROM tbl_user WHERE id = $1",
    [id]
  );

  if (result.rowCount === 0) {
    throw new Error("User không tồn tại");
  }
};
exports.updateUser = async (id, updatedData) => {
  const fields = [];
  const values = [];
  let index = 1;

  for (const key in updatedData) {
    fields.push(`${key} = $${index}`);
    values.push(updatedData[key]);
    index++;
  }
  values.push(id);

  const query = `UPDATE tbl_user SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;

  const result = await db.query(query, values);

  if (result.rowCount === 0) {
    throw new Error('User không tồn tại');
  }

  return result.rows[0];
}

exports.getUsers = () => repo.getAllUsers();
