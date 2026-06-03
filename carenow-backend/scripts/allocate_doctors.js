const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'CareNow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '070402',
});

async function allocateDoctors() {
  try {
    // 1. Get all clinic places that are mapped to a partner
    const placesRes = await pool.query('SELECT id, partner_id FROM tbl_clinic_place WHERE partner_id IS NOT NULL');
    const mappedPlaces = placesRes.rows;

    if (mappedPlaces.length === 0) {
      console.log('No mapped clinic places found.');
      return;
    }

    // 2. Get all doctors (tbl_clinic)
    const doctorsRes = await pool.query('SELECT id, name FROM tbl_clinic');
    const doctors = doctorsRes.rows;

    console.log(`Found ${mappedPlaces.length} mapped clinic places and ${doctors.length} doctors.`);

    // 3. Allocate sequentially
    for (let i = 0; i < doctors.length; i++) {
      const doctor = doctors[i];
      const place = mappedPlaces[i % mappedPlaces.length]; // Distribute evenly

      await pool.query(
        'UPDATE tbl_clinic SET place_ids = $1, partner_ids = $2 WHERE id = $3',
        [place.id.toString(), place.partner_id.toString(), doctor.id]
      );
    }

    console.log('Successfully allocated doctors to mapped clinic places and partners.');
  } catch (error) {
    console.error('Error allocating doctors:', error);
  } finally {
    pool.end();
  }
}

allocateDoctors();
