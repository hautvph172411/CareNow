const pool = require('../src/config/database');

async function main() {
  try {
    const res = await pool.query(`
      SELECT id, name, status, place_ids, partner_ids 
      FROM tbl_clinic 
      WHERE id = 5518
    `);
    console.log('--- DOCTOR 5518 ---');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
