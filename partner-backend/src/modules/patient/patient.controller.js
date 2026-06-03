const service = require('./patient.service');

exports.googleLogin = async (req, res) => {
  try {
    const { id_token } = req.body;
    const result = await service.loginWithGoogle(id_token);

    res.json({
      success: true,
      data: result,
      message: result.isNewUser
        ? 'Đăng ký và đăng nhập thành công'
        : 'Đăng nhập thành công',
    });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const data = await service.getById(req.patient.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const data = await service.updateProfile(req.patient.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật hồ sơ thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const data = await service.list(req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await service.getById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};
