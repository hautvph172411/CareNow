const pool = require('../src/config/database');

async function main() {
  const targetPlaceIds = [1481, 1482, 1483, 1484, 1485];

  try {
    console.log('=== RÀ SOÁT VÀ XÓA CÁC LỊCH KHÁM SAI NƠI KHÁM / ĐỐI TÁC ===\n');

    // 1. Lấy tất cả bác sĩ thuộc 5 cơ sở y tế này
    const doctorsRes = await pool.query(`
      SELECT id, name, place_ids, partner_ids 
      FROM tbl_clinic
    `);

    const doctorToPlaceMap = {};
    doctorsRes.rows.forEach(d => {
      const places = (d.place_ids || '').split(',').filter(Boolean).map(Number);
      const matchedPlaces = places.filter(id => targetPlaceIds.includes(id));
      if (matchedPlaces.length > 0) {
        doctorToPlaceMap[d.id] = {
          name: d.name,
          correctPlaceIds: matchedPlaces,
          allPlaceIds: places
        };
      }
    });

    console.log(`Tìm thấy ${Object.keys(doctorToPlaceMap).length} bác sĩ liên quan đến 5 cơ sở y tế mới.`);

    // 2. Với mỗi bác sĩ, xóa các lịch hẹn trong tbl_appt_schedule_block không khớp với nơi khám chính xác
    for (const [docIdStr, info] of Object.entries(doctorToPlaceMap)) {
      const docId = parseInt(docIdStr, 10);
      
      console.log(`\nBác sĩ [ID: ${docId}] "${info.name}":`);
      console.log(`  - Nơi khám chính xác: ${info.correctPlaceIds.join(', ')}`);

      // Kiểm tra xem bác sĩ này có lịch hẹn nào ở nơi khám khác không
      const checkBlocksRes = await pool.query(`
        SELECT b.id, b.clinic_place_id, pl.name as place_name, b.partner_id, pt.name as partner_name
        FROM tbl_appt_schedule_block b
        LEFT JOIN tbl_clinic_place pl ON b.clinic_place_id = pl.id
        LEFT JOIN tbl_partner pt ON b.partner_id = pt.id
        WHERE b.clinic_id = $1
      `, [docId]);

      const wrongBlockIds = [];
      checkBlocksRes.rows.forEach(b => {
        if (!info.correctPlaceIds.includes(b.clinic_place_id)) {
          wrongBlockIds.push(b.id);
          console.log(`    ⚠️ Phát hiện lịch sai: [Block ID: ${b.id}] tại Place [ID: ${b.clinic_place_id}] "${b.place_name}" (Partner: "${b.partner_name}")`);
        }
      });

      if (wrongBlockIds.length > 0) {
        console.log(`  => Đang xóa ${wrongBlockIds.length} lịch khám sai...`);
        
        // Xóa liên kết chuyên khoa của block trước để tránh lỗi khóa ngoại (nếu có)
        await pool.query(`
          DELETE FROM tbl_appt_schedule_block_specialist
          WHERE schedule_block_id = ANY($1)
        `, [wrongBlockIds]);

        // Xóa block
        await pool.query(`
          DELETE FROM tbl_appt_schedule_block
          WHERE id = ANY($1)
        `, [wrongBlockIds]);

        console.log(`  => Đã xóa xong.`);
      } else {
        console.log(`  - Lịch khám hoàn toàn sạch sẽ (không có lịch sai).`);
      }
    }

    console.log('\n=== HOÀN THÀNH XÓA LỊCH KHÁM SAI ===');
  } catch (err) {
    console.error('Lỗi:', err.message);
  } finally {
    pool.end();
  }
}

main();
