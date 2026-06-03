const pool = require('../src/config/database');

async function main() {
  try {
    const res5 = await pool.query('SELECT COUNT(*) FROM tbl_location_ward WHERE province_id = 5');
    console.log('Wards in Province 5 (TP HCM):', res5.rows[0].count);

    const res1 = await pool.query('SELECT COUNT(*) FROM tbl_location_ward WHERE province_id = 1');
    console.log('Wards in Province 1 (Hà Nội):', res1.rows[0].count);

    const sample5 = await pool.query('SELECT * FROM tbl_location_ward WHERE province_id = 5 LIMIT 10');
    console.log('Sample Wards in Province 5:');
    console.table(sample5.rows);

    const sample1 = await pool.query('SELECT * FROM tbl_location_ward WHERE province_id = 1 LIMIT 10');
    console.log('Sample Wards in Province 1:');
    console.table(sample1.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
