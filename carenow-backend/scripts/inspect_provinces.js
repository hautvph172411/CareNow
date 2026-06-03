const pool = require('../src/config/database');

async function main() {
  try {
    const res = await pool.query('SELECT * FROM tbl_location_province ORDER BY id');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
