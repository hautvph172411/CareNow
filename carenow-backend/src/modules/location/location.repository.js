const pool = require('../../config/database');

exports.getProvinces = async () => {
  const { rows } = await pool.query(
    'SELECT id, name, url, type FROM tbl_location_province ORDER BY name ASC'
  );
  return rows;
};

exports.getWardsByProvince = async (provinceId) => {
  const { rows } = await pool.query(
    'SELECT id, name, url, type FROM tbl_location_ward WHERE province_id = $1 ORDER BY name ASC',
    [provinceId]
  );
  return rows;
};
