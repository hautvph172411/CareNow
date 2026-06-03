const service = require('./settings.service');

exports.getAllSettings = async (req, res) => {
  try {
    const data = await service.getAllSettings();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const value = await service.getSettingByKey(key);
    res.json({ success: true, data: { [key]: value } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    // req.body should be an object: { logo_url: "...", site_name: "..." }
    const data = await service.updateSettings(req.body);
    res.json({ success: true, message: 'Cập nhật thành công', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
