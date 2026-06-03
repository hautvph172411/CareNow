const pool = require('../src/config/database');

async function main() {
  try {
    console.log('=== KẾT QUẢ IMPORT TRONG DATABASE ===\n');

    // 1. Query clinics
    const clinicPlaceIds = [1481, 1482, 1483, 1484, 1485];
    const placesRes = await pool.query(`
      SELECT p.id, p.name, prov.name as province, w.name as ward, p.logo, p.url 
      FROM tbl_clinic_place p
      LEFT JOIN tbl_location_province prov ON p.province_id = prov.id
      LEFT JOIN tbl_location_ward w ON p.district_id = w.id
      WHERE p.id = ANY($1)
      ORDER BY p.id
    `, [clinicPlaceIds]);

    console.log('--- 1. CƠ SỞ Y TẾ ĐÃ IMPORT ---');
    placesRes.rows.forEach(r => {
      console.log(`[ID: ${r.id}] ${r.name}`);
      console.log(`  - Tỉnh/Thành: ${r.province} | Phường/Xã: ${r.ward}`);
      console.log(`  - Slug URL: ${r.url}`);
      console.log(`  - Logo Cloudinary: ${r.logo ? (r.logo.includes('res.cloudinary.com') ? 'Đúng (res.cloudinary.com)' : 'Sai (chưa upload)') : 'Không có'}`);
    });

    console.log('\n--- 2. BÁC SĨ ĐÃ IMPORT VÀ LIÊN KẾT ---');
    for (const placeId of clinicPlaceIds) {
      const doctorsRes = await pool.query(`
        SELECT id, name, title, specialist_ids, picture 
        FROM tbl_clinic 
        WHERE place_ids LIKE $1 OR place_ids LIKE $2 OR place_ids = $3
      `, [`%,${placeId},%`, `${placeId},%`, `${placeId}`]);
      
      const placeName = placesRes.rows.find(p => p.id === placeId)?.name || `Place #${placeId}`;
      console.log(`\nCơ sở: ${placeName} (Tổng số bác sĩ: ${doctorsRes.rows.length})`);
      doctorsRes.rows.forEach(d => {
        console.log(`  * [ID: ${d.id}] ${d.title} ${d.name}`);
        console.log(`    - Chuyên khoa IDs: ${d.specialist_ids}`);
        console.log(`    - Avatar Cloudinary: ${d.picture ? (d.picture.includes('res.cloudinary.com') ? 'Đúng (res.cloudinary.com)' : 'Sai') : 'Không có'}`);
      });
    }

  } catch (err) {
    console.error('Error during verification:', err.message);
  } finally {
    pool.end();
  }
}

main();
