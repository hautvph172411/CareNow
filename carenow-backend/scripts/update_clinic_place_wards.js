const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'CareNow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '070402',
});

function getCoreName(name) {
  return name.toLowerCase()
    .replace(/^(phường|xã|thị trấn|quận|huyện)\s+/i, '')
    .trim();
}

async function updateClinicPlaceWards() {
  try {
    console.log('=== BẮT ĐẦU CẬP NHẬT PHƯỜNG/XÃ (DISTRICT_ID) CHO CƠ SỞ Y TẾ ===');

    const clinicsRes = await pool.query('SELECT id, name, address, province_id, district_id FROM tbl_clinic_place');
    const clinics = clinicsRes.rows;
    console.log(`Tìm thấy ${clinics.length} cơ sở y tế trong database.`);

    const wardsRes = await pool.query('SELECT id, name, type, province_id FROM tbl_location_ward');
    const allWards = wardsRes.rows;

    let updatedCount = 0;

    for (const clinic of clinics) {
      if (!clinic.address || !clinic.province_id) {
        continue;
      }

      const addressLower = clinic.address.toLowerCase();
      
      // Lọc các ward thuộc cùng tỉnh thành
      const provinceWards = allWards.filter(w => w.province_id === clinic.province_id);

      let bestMatch = null;
      let maxScore = 0;

      for (const ward of provinceWards) {
        const coreName = getCoreName(ward.name);
        if (coreName.length < 3) continue;

        let score = 0;

        // Nếu địa chỉ chứa cả cụm "phường [tên]" hoặc "xã [tên]"
        if (addressLower.includes(ward.name.toLowerCase())) {
          score = coreName.length * 10;
        }
        // Nếu địa chỉ chỉ chứa tên lõi (ví dụ: "tương mai")
        else if (addressLower.includes(coreName)) {
          score = coreName.length;
        }

        if (score > maxScore) {
          maxScore = score;
          bestMatch = ward;
        }
      }

      if (bestMatch && bestMatch.id !== clinic.district_id) {
        await pool.query(
          'UPDATE tbl_clinic_place SET district_id = $1 WHERE id = $2',
          [bestMatch.id, clinic.id]
        );
        updatedCount++;
        console.log(`[CẬP NHẬT WARD] ID: ${clinic.id} | ${clinic.name}`);
        console.log(`   Địa chỉ: ${clinic.address}`);
        console.log(`   -> Gán Ward: [ID: ${bestMatch.id}] ${bestMatch.name} (Trước đó: ${clinic.district_id})`);
      }
    }

    console.log('\n=== HOÀN THÀNH CÔNG VIỆC ===');
    console.log(`Đã cập nhật ward (district_id) thành công cho ${updatedCount} cơ sở y tế.`);

  } catch (error) {
    console.error('Lỗi nghiêm trọng:', error.message);
  } finally {
    pool.end();
  }
}

updateClinicPlaceWards();
