const pool = require('../src/config/database');

async function main() {
  try {
    const res = await pool.query(`
      SELECT id, name, address, province_id, district_id 
      FROM tbl_clinic_place 
      WHERE name ILIKE '%Gia An%'
    `);
    console.log('--- CLINIC PLACES WITH GIA AN ---');
    console.table(res.rows);

    const res2 = await pool.query(`
      SELECT id, name, place_ids, address, province_id, district_ids
      FROM tbl_clinic
      WHERE name ILIKE '%Gia An%' OR place_ids LIKE '%1119%' OR place_ids LIKE '%1482%'
    `);
    console.log('--- DOCTORS / SERVICES WITH GIA AN / PLACE 1119 / PLACE 1482 ---');
    console.table(res2.rows);

    // Let's also check place 1119
    const res3 = await pool.query(`
      SELECT id, name, address, province_id 
      FROM tbl_clinic_place 
      WHERE id = 1119
    `);
    console.log('--- CLINIC PLACE 1119 ---');
    console.table(res3.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
