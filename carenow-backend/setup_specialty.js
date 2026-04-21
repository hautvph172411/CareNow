const pool = require('./src/config/database');

async function createTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS tbl_clinic_specialist (
      id SERIAL PRIMARY KEY,
      parent_id INTEGER DEFAULT 0,
      name VARCHAR(155) NOT NULL,
      url TEXT,
      title TEXT,
      keyword TEXT,
      description VARCHAR(255),
      content TEXT,
      picture TEXT,
      status INTEGER DEFAULT 1,
      type INTEGER DEFAULT 1,
      rank INTEGER,
      updated_time INTEGER
    );
  `;
  try {
    const res = await pool.query(query);
    console.log('Table tbl_clinic_specialist verified/created.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createTable();
