const repo = require('./location.repository');

exports.getProvinces = async (req, res) => {
  try {
    const data = await repo.getProvinces();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDistrictsByProvince = async (req, res) => {
  try {
    const data = await repo.getDistrictsByProvince(req.params.provinceId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getWardsByProvince = async (req, res) => {
  try {
    const data = await repo.getWardsByProvince(req.params.provinceId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
