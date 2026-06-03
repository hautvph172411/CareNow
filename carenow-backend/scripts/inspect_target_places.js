const pool = require('../src/config/database');

async function main() {
  try {
    const res = await pool.query(`
      SELECT id, name, partner_id, status 
      FROM tbl_clinic_place 
      WHERE id IN (1481, 1482, 1483, 1484, 1485)
    `);
    console.log('--- TARGET PLACES ---');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
