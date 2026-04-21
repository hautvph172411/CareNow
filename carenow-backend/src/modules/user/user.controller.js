const service = require('./user.service');
const jwt = require('jsonwebtoken');


exports.register = async (req, res) => {
  try {
    const user = await service.register(req.body);
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await service.deleteUser(userId);
    res.json({ message: 'Xoá user thành công' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updatedData = req.body;
    const updatedUser = await service.updateUser(userId, updatedData);
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await service.login(username, password);

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  const users = await service.getUsers();
  res.json(users);
};
