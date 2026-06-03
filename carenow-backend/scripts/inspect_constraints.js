const pool = require('../src/config/database');

async function main() {
  try {
    const res = await pool.query(`
      SELECT column_name, is_nullable, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'tbl_clinic_place'
      ORDER BY ordinal_position
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
