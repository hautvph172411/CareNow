const pool = require('../src/config/database');

async function main() {
  try {
    const res = await pool.query(`
      SELECT id, name, place_ids, address, province_id, district_ids
      FROM tbl_clinic
      WHERE district_ids IS NOT NULL AND district_ids != ''
      LIMIT 10
    `);
    console.log('--- DOCTORS WITH DISTRICT_IDS ---');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
