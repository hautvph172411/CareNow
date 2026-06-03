const pool = require('../src/config/database');

async function main() {
  try {
    const res = await pool.query(`
      SELECT id, name, status 
      FROM tbl_partner
      LIMIT 20
    `);
    console.log('--- PARTNERS ---');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
