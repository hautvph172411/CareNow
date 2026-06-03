const pool = require('./src/config/database');

async function createTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS tbl_appt_schedule_logs (
      id SERIAL PRIMARY KEY,
      schedule_block_id INTEGER,
      action_type VARCHAR(50),
      user_id INTEGER,
      user_email VARCHAR(255),
      user_type VARCHAR(50),
      old_data JSONB,
      new_data JSONB,
      created_at BIGINT
    );
  `;
  try {
    await pool.query(query);
    console.log('✅ Table tbl_appt_schedule_logs created successfully.');
  } catch (err) {
    console.error('❌ Error creating table:', err.message);
  } finally {
    process.exit();
  }
}

createTable();
