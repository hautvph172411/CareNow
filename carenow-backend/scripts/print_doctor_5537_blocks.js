const pool = require('../src/config/database');

async function main() {
  try {
    const res = await pool.query(`
      SELECT b.id, b.clinic_id, c.name as doc_name, b.partner_id, p.name as partner_name, 
             b.clinic_place_id, pl.name as place_name, b.day_of_week, b.session_type,
             b.start_time, b.end_time
      FROM tbl_appt_schedule_block b
      LEFT JOIN tbl_clinic c ON b.clinic_id = c.id
      LEFT JOIN tbl_partner p ON b.partner_id = p.id
      LEFT JOIN tbl_clinic_place pl ON b.clinic_place_id = pl.id
      WHERE b.clinic_id = 5537
      ORDER BY b.id
    `);
    console.log('--- ALL BLOCKS FOR DOCTOR 5537 ---');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
