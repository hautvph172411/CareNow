const pool = require('../src/config/database');

async function main() {
  try {
    const wards = [
      { name: 'Võ Thị Sáu', province: 5 },
      { name: 'Bình Trị Đông B', province: 5 },
      { name: 'Nhân Chính', province: 1 },
      { name: 'An Lợi Đông', province: 5 },
      { name: 'Tân Sơn Hòa', province: 5 }
    ];

    for (const w of wards) {
      const res = await pool.query(
        `SELECT id, name, type, province_id 
         FROM tbl_location_ward 
         WHERE province_id = $1 AND (name ILIKE $2 OR name ILIKE $3)`,
        [w.province, `%${w.name}%`, `%${w.name.replace(/ /g, '')}%`]
      );
      console.log(`Search for "${w.name}" in Province ${w.province}:`);
      console.table(res.rows);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
