const repo = require('./user.repository');
const { hashPassword, comparePassword } = require('../../ultis/hash');

exports.getUsers = async (query) => {
  return await repo.getAll(query);
};

exports.getUserById = async (id) => {
  const user = await repo.findById(id);
  if (!user) throw new Error('User không tồn tại');
  delete user.password;
  delete user.salt;
  return user;
};

exports.createUser = async (data) => {
  const exists = await repo.findByUsername(data.username);
  if (exists) throw new Error('Tên đăng nhập đã tồn tại');

  const payload = { ...data };
  if (payload.password) {
    payload.password = await hashPassword(payload.password);
  }
  
  if (!payload.created_at) {
    payload.created_at = Math.floor(Date.now() / 1000);
  }

  // Remove confirm password if any
  delete payload.confirmPassword;

  return await repo.createUser(payload);
};

exports.updateUser = async (id, data) => {
  const user = await repo.findById(id);
  if (!user) throw new Error('User không tồn tại');

  const payload = { ...data };
  
  // Only hash password if it's being updated
  if (payload.password) {
    payload.password = await hashPassword(payload.password);
  } else {
    delete payload.password;
  }
  
  delete payload.confirmPassword;
  payload.updated_at = Math.floor(Date.now() / 1000);

  return await repo.updateUser(id, payload);
};

exports.deleteUser = async (id) => {
  const user = await repo.findById(id);
  if (!user) throw new Error('User không tồn tại');
  return await repo.remove(id);
};

exports.login = async (identifier, password) => {
  const cleanIdentifier = identifier ? identifier.trim() : '';
  const user = await repo.findByUsername(cleanIdentifier);
  if (!user) throw new Error('Sai tài khoản hoặc mật khẩu');

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new Error('Sai tài khoản hoặc mật khẩu');

  if (user.status === 0) {
    throw new Error('Tài khoản chưa được kích hoạt, vui lòng liên hệ quản trị viên');
  }

  if (user.status === -1) {
    throw new Error('Tài khoản đã bị xóa khỏi hệ thống');
  }

  delete user.password;
  delete user.salt;
  return user;
};
