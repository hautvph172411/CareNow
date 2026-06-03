const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'CareNow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '070402',
});

async function removeDuplicateWards() {
  const client = await pool.connect();
  try {
    console.log('=== BẮT ĐẦU XÓA PHƯỜNG XÃ TRÙNG LẶP ===');
    
    // Bắt đầu transaction
    await client.query('BEGIN');

    // 1. Cập nhật tbl_patient để chuyển tham chiếu sang ID nhỏ nhất của phường xã trùng lặp
    console.log('1. Đang kiểm tra và cập nhật các tham chiếu ward_id trong tbl_patient...');
    const updatePatientsSql = `
      UPDATE tbl_patient p
      SET ward_id = target_ward.id
      FROM tbl_location_ward duplicate_ward
      JOIN tbl_location_ward target_ward 
        ON duplicate_ward.province_id = target_ward.province_id 
        AND duplicate_ward.name = target_ward.name
      WHERE p.ward_id = duplicate_ward.id
        AND duplicate_ward.id > target_ward.id
        AND target_ward.id = (
          SELECT MIN(id) 
          FROM tbl_location_ward 
          WHERE province_id = duplicate_ward.province_id 
            AND name = duplicate_ward.name
        )
    `;
    const updateRes = await client.query(updatePatientsSql);
    console.log(`   -> Đã cập nhật ${updateRes.rowCount} bệnh nhân để chuyển sang ward_id chuẩn.`);

    // 2. Xóa các hàng trùng lặp trong tbl_location_ward, giữ lại hàng có ID nhỏ nhất
    console.log('2. Đang xóa các phường/xã trùng lặp (giữ lại ID nhỏ nhất)...');
    const deleteDuplicatesSql = `
      DELETE FROM tbl_location_ward a
      USING tbl_location_ward b
      WHERE a.id > b.id
        AND a.province_id = b.province_id
        AND a.name = b.name
    `;
    const deleteRes = await client.query(deleteDuplicatesSql);
    console.log(`   -> Đã xóa ${deleteRes.rowCount} phường/xã trùng lặp.`);

    // Commit transaction
    await client.query('COMMIT');
    console.log('=== HOÀN THÀNH CÔNG VIỆC ===');
    console.log('Giao dịch đã được commit thành công.');
  } catch (error) {
    // Rollback transaction nếu có lỗi xảy ra
    await client.query('ROLLBACK');
    console.error('Lỗi nghiêm trọng, đã rollback transaction:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

removeDuplicateWards();
