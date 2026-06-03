const pool = require('../src/config/database');

async function main() {
  try {
    const res = await pool.query('SELECT id, name FROM tbl_clinic_specialist ORDER BY id');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
