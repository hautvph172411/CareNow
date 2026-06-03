const repo = require('./user.repository');
const { hashPassword, comparePassword } = require('../../utils/hash');

exports.getUsers = async (query) => {
  const page  = parseInt(query.page,  10) || 1;
  const limit = parseInt(query.limit, 10) || 50;
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    repo.getAll({ ...query, limit, offset }),
    repo.countAll(query),
  ]);

  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.getUserById = async (id, partnerId = null) => {
  const user = await repo.findById(id);
  if (!user) throw new Error('User không tồn tại');
  if (partnerId && user.partner_id !== partnerId) {
    throw new Error('Bạn không có quyền xem thông tin tài khoản này');
  }
  delete user.password;
  delete user.salt;
  return user;
};

exports.createUser = async (data) => {
  if (!data.username || !data.username.trim()) {
    throw new Error('Tên đăng nhập không hợp lệ');
  }
  const cleanUsername = data.username.trim();

  const exists = await repo.findByUsername(cleanUsername);
  if (exists) throw new Error('Tên đăng nhập đã tồn tại');

  const payload = { ...data, username: cleanUsername };
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

exports.updateUser = async (id, data, partnerId = null) => {
  const user = await repo.findById(id);
  if (!user) throw new Error('User không tồn tại');
  if (partnerId && user.partner_id !== partnerId) {
    throw new Error('Bạn không có quyền cập nhật tài khoản này');
  }

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

exports.deleteUser = async (id, partnerId = null) => {
  const user = await repo.findById(id);
  if (!user) throw new Error('User không tồn tại');
  if (partnerId && user.partner_id !== partnerId) {
    throw new Error('Bạn không có quyền xóa tài khoản này');
  }
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
