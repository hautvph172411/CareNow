const pool = require('../../config/database');

exports.getProvinces = async () => {
  try {
    const result = await pool.query(`SELECT * FROM tbl_location_province ORDER BY name`);
    return result.rows;
  } catch (err) {
    console.error(err);
    return [];
  }
};

exports.getDistrictsByProvince = async (provinceId) => {
  try {
    // Dùng tbl_location_ward làm districts (phường/xã/quận/huyện)
    const result = await pool.query(
      `SELECT * FROM tbl_location_ward WHERE province_id = $1 ORDER BY name`,
      [provinceId]
    );
    return result.rows;
  } catch (err) {
    console.error(err);
    return [];
  }
};

exports.getWardsByProvince = async (provinceId) => {
  try {
    const result = await pool.query(`SELECT * FROM tbl_location_ward WHERE province_id = $1`, [provinceId]);
    return result.rows;
  } catch (err) {
    console.error(err);
    return [];
  }
};
