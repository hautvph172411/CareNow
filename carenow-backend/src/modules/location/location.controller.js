const repo = require('./location.repository');

exports.getProvinces = async (req, res) => {
  try {
    const data = await repo.getProvinces();
    res.json({ message: 'Success', data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getWards = async (req, res) => {
  try {
    const { province_id } = req.query;
    if (!province_id) {
      return res.status(400).json({ message: 'province_id là bắt buộc' });
    }
    const data = await repo.getWardsByProvince(province_id);
    res.json({ message: 'Success', data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
