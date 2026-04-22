const service = require('./user.service');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await service.login(username, password);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '8h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          role: user.role,
          avatar: user.avatar
        }
      }
    });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const data = await service.createUser(req.body);
    res.status(201).json({ success: true, data, message: 'Đăng ký thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const data = await service.getUsers(req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const data = await service.getUserById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const data = await service.createUser(req.body);
    res.status(201).json({ success: true, data, message: 'Thêm người dùng thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const data = await service.updateUser(req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await service.deleteUser(req.params.id);
    res.json({ success: true, message: 'Xóa người dùng thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
