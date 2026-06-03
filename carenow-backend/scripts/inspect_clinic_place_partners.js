const pool = require('../src/config/database');

async function main() {
  try {
    const totalCount = await pool.query(`SELECT COUNT(*) FROM tbl_clinic_place`);
    const withPartnerCount = await pool.query(`SELECT COUNT(*) FROM tbl_clinic_place WHERE partner_id IS NOT NULL`);
    console.log('Total clinic places:', totalCount.rows[0].count);
    console.log('Clinic places with partner_id:', withPartnerCount.rows[0].count);

    const samples = await pool.query(`
      SELECT id, name, partner_id, status 
      FROM tbl_clinic_place 
      WHERE partner_id IS NOT NULL 
      LIMIT 10
    `);
    console.log('--- SAMPLES WITH PARTNER_ID ---');
    console.table(samples.rows);

    const scheduleBlocksCount = await pool.query(`SELECT COUNT(*) FROM tbl_appt_schedule_block`);
    console.log('Total appt schedule blocks:', scheduleBlocksCount.rows[0].count);

    const sampleBlocks = await pool.query(`
      SELECT id, clinic_id, partner_id, clinic_place_id, day_of_week, session_type
      FROM tbl_appt_schedule_block
      LIMIT 10
    `);
    console.log('--- SAMPLE SCHEDULE BLOCKS ---');
    console.table(sampleBlocks.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
