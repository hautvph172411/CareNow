const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'CareNow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '070402',
});

// Helper to clean up name for comparison
function getCoreName(name) {
  return name.toLowerCase()
    .replace(/^(phường|xã|thị trấn|quận|huyện)\s+/i, '')
    .trim();
}

async function findWardMatches() {
  try {
    const clinicsRes = await pool.query('SELECT id, name, address, province_id, district_id FROM tbl_clinic_place WHERE status = 1');
    const clinics = clinicsRes.rows;

    const wardsRes = await pool.query('SELECT id, name, type, province_id FROM tbl_location_ward');
    const allWards = wardsRes.rows;

    console.log(`=== BÁO CÁO GỢI Ý PHƯỜNG XÃ CHO CLINIC PLACES ===\n`);

    for (const clinic of clinics) {
      if (!clinic.address || !clinic.province_id) {
        console.log(`ID: ${clinic.id} | ${clinic.name} -> Không có địa chỉ hoặc province_id. Bỏ qua.`);
        continue;
      }

      const addressLower = clinic.address.toLowerCase();
      
      // Lọc các ward thuộc cùng tỉnh thành
      const provinceWards = allWards.filter(w => w.province_id === clinic.province_id);

      let bestMatch = null;
      let maxScore = 0;

      for (const ward of provinceWards) {
        const coreName = getCoreName(ward.name);
        if (coreName.length < 3) continue; // Bỏ qua các tên quá ngắn dễ khớp nhầm

        let score = 0;

        // Nếu địa chỉ chứa cả cụm "phường [tên]" hoặc "xã [tên]"
        if (addressLower.includes(ward.name.toLowerCase())) {
          score = coreName.length * 10;
        }
        // Nếu địa chỉ chỉ chứa tên lõi (ví dụ: "tương mai" thay vì "phường tương mai")
        else if (addressLower.includes(coreName)) {
          score = coreName.length;
        }

        if (score > maxScore) {
          maxScore = score;
          bestMatch = ward;
        }
      }

      if (bestMatch) {
        console.log(`ID: ${clinic.id} | ${clinic.name}`);
        console.log(`  Địa chỉ: ${clinic.address}`);
        console.log(`  -> Gợi ý khớp: [ID: ${bestMatch.id}] ${bestMatch.name} (${bestMatch.type}) | Điểm: ${maxScore}`);
        console.log(`  -> Hiện tại district_id (ward_id): ${clinic.district_id}`);
      } else {
        console.log(`ID: ${clinic.id} | ${clinic.name}`);
        console.log(`  Địa chỉ: ${clinic.address}`);
        console.log(`  -> KHÔNG TÌM THẤY PHƯỜNG XÃ PHÙ HỢP`);
      }
      console.log('---');
    }

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

findWardMatches();
