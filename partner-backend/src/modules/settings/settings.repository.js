const db = require('../../config/database');

exports.getAll = async () => {
  const result = await db.query('SELECT setting_key, setting_value FROM tbl_settings');
  return result.rows;
};

exports.getByKey = async (key) => {
  const result = await db.query('SELECT setting_value FROM tbl_settings WHERE setting_key = $1', [key]);
  return result.rows[0];
};

exports.updateKey = async (key, value) => {
  const result = await db.query(`
    INSERT INTO tbl_settings (setting_key, setting_value) 
    VALUES ($1, $2)
    ON CONFLICT (setting_key) 
    DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [key, value]);
  return result.rows[0];
};

exports.updateBulk = async (settingsArray) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const { key, value } of settingsArray) {
      await client.query(`
        INSERT INTO tbl_settings (setting_key, setting_value) 
        VALUES ($1, $2)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP
      `, [key, value]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
