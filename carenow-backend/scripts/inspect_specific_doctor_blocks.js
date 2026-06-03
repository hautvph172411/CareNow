const pool = require('../src/config/database');

async function main() {
  const doctorIds = [5518, 5526, 5537, 5517, 5607];
  try {
    const res = await pool.query(`
      SELECT b.id, b.clinic_id, c.name as doc_name, b.partner_id, p.name as partner_name, 
             b.clinic_place_id, pl.name as place_name, b.day_of_week, b.session_type
      FROM tbl_appt_schedule_block b
      LEFT JOIN tbl_clinic c ON b.clinic_id = c.id
      LEFT JOIN tbl_partner p ON b.partner_id = p.id
      LEFT JOIN tbl_clinic_place pl ON b.clinic_place_id = pl.id
      WHERE b.clinic_id = ANY($1)
      ORDER BY b.clinic_id, b.day_of_week
    `, [doctorIds]);

    console.log('--- EXISTING BLOCKS FOR SPECIAL DOCTORS ---');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
