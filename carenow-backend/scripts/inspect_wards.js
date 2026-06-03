const pool = require('../src/config/database');

async function main() {
  try {
    const countRes = await pool.query('SELECT COUNT(*) FROM tbl_location_ward');
    console.log('Total wards:', countRes.rows[0].count);

    const sampleRes = await pool.query('SELECT * FROM tbl_location_ward LIMIT 10');
    console.log('Sample wards:');
    console.table(sampleRes.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
