const pool = require('../src/config/database');

async function main() {
  try {
    const queries = ['Nhân Chính', 'Võ Thị Sáu', 'Bình Trị Đông', 'An Lợi Đông'];
    for (const q of queries) {
      const res = await pool.query(
        `SELECT id, name, url, type, province_id 
         FROM tbl_location_ward 
         WHERE name ILIKE $1`,
        [`%${q}%`]
      );
      console.log(`Search for "${q}":`);
      console.table(res.rows);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
