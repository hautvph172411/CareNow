const pool = require('../src/config/database');

async function main() {
  try {
    const res = await pool.query('SELECT * FROM tbl_clinic_place LIMIT 1');
    if (res.rows.length > 0) {
      console.log('Columns:', Object.keys(res.rows[0]));
    } else {
      console.log('Table is empty or no columns found');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
