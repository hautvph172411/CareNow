const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

// Hàm phụ để sleep/delay tránh bị rate limit
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getNextData(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });
    const $ = cheerio.load(data);
    const script = $('#__NEXT_DATA__').html();
    if (script) {
      const parsed = JSON.parse(script);
      return parsed.props.pageProps.initialState || parsed.props.pageProps.data;
    }
  } catch (err) {
    console.error(`  [Fetcher] Lỗi tải trang ${url}:`, err.message);
  }
  return null;
}

// Trích xuất danh sách phòng khám từ lịch khám của bác sĩ
function extractClinics(lichkham) {
  const clinics = new Map();
  if (!lichkham || typeof lichkham !== 'object') return [];
  for (const dayKey of Object.keys(lichkham)) {
    const day = lichkham[dayKey];
    if (day && day.buoi && typeof day.buoi === 'object') {
      for (const buoiKey of Object.keys(day.buoi)) {
        const buoi = day.buoi[buoiKey];
        if (buoi && buoi.noikham && typeof buoi.noikham === 'object') {
          const nk = buoi.noikham;
          if (nk.url && nk.ma) {
            clinics.set(nk.url, nk);
          }
        }
      }
    }
  }
  return Array.from(clinics.values());
}

async function scrapeDetails() {
  console.log('=== BẮT ĐẦU CÀO CHI TIẾT BÁC SĨ & CƠ SỞ Y TẾ ===');
  console.log('Chỉ cập nhật Bác sĩ và Cơ sở y tế đã tồn tại trong database.\n');

  let doctorsUpdated = 0;
  let clinicsUpdated = 0;
  const processedClinics = new Set(); // Để tránh cào trùng cơ sở y tế trong 1 phiên chạy

  try {
    // 1. Lấy danh sách chuyên khoa từ database để tìm bác sĩ theo chuyên khoa
    const specRes = await pool.query('SELECT id, name, url FROM tbl_clinic_specialist WHERE status = 1');
    const specialties = specRes.rows;
    console.log(`Tìm thấy ${specialties.length} chuyên khoa trong database.`);

    for (const spec of specialties) {
      if (!spec.url) continue;
      
      const specUrl = `https://bookingcare.vn/dich-vu-y-te/kham-chuyen-khoa/${spec.url}`;
      console.log(`\n>> Đang quét danh sách bác sĩ chuyên khoa: ${spec.name} (${specUrl})`);
      
      const specData = await getNextData(specUrl);
      if (!specData || !specData.data || !specData.data.bs) {
        console.log(`   - Không lấy được danh sách bác sĩ cho chuyên khoa: ${spec.name}`);
        continue;
      }

      const doctors = specData.data.bs;
      console.log(`   - Tìm thấy ${doctors.length} bác sĩ từ BookingCare.`);

      for (const doc of doctors) {
        if (!doc.url) continue;

        // Tìm bác sĩ tương ứng trong DB của chúng ta
        const localDocRes = await pool.query(
          'SELECT id, name, url, content FROM tbl_clinic WHERE url = $1',
          [doc.url]
        );

        if (localDocRes.rows.length === 0) {
          // Bác sĩ này không có trong DB của chúng ta, bỏ qua (không chèn mới)
          continue;
        }

        const localDoc = localDocRes.rows[0];
        console.log(`   + Phát hiện bác sĩ khớp: [ID: ${localDoc.id}] ${localDoc.name}`);

        // Xây dựng link chi tiết bác sĩ
        let docUrl = doc.lk || `https://bookingcare.vn/bac-si/${doc.url}-p${doc.ma}.html`;
        if (docUrl.startsWith('/')) {
          docUrl = 'https://bookingcare.vn' + docUrl;
        }

        console.log(`     -> Đang tải trang chi tiết bác sĩ: ${docUrl}`);
        const docDetailData = await getNextData(docUrl);
        await sleep(1000); // Tránh spam quá tải

        if (!docDetailData || !docDetailData.data) {
          console.log(`     -> Lỗi: Không thể tải chi tiết bác sĩ ${localDoc.name}`);
          continue;
        }

        const docData = docDetailData.data;

        // Cập nhật noidung giới thiệu bác sĩ
        if (docData.noidung) {
          await pool.query(
            'UPDATE tbl_clinic SET content = $1 WHERE id = $2',
            [docData.noidung, localDoc.id]
          );
          doctorsUpdated++;
          console.log(`     [DB] Đã cập nhật giới thiệu chi tiết (content) cho bác sĩ ${localDoc.name}`);
        } else {
          console.log(`     -> Bác sĩ không có nội dung giới thiệu chi tiết.`);
        }

        // Xử lý các phòng khám liên kết trong lịch khám của bác sĩ
        const clinics = extractClinics(docData.lichkham);
        for (const clinic of clinics) {
          if (processedClinics.has(clinic.url)) continue;

          // Tìm xem phòng khám có tồn tại trong DB của chúng ta không
          const localClinicRes = await pool.query(
            'SELECT id, name, url, metadata FROM tbl_clinic_place WHERE url = $1',
            [clinic.url]
          );

          if (localClinicRes.rows.length > 0) {
            const localClinic = localClinicRes.rows[0];
            processedClinics.add(clinic.url);

            console.log(`     + Phát hiện cơ sở y tế khớp: [ID: ${localClinic.id}] ${localClinic.name}`);

            // Lưu bc_id vào metadata
            let currentMeta = {};
            try {
              currentMeta = JSON.parse(localClinic.metadata || '{}');
            } catch (e) {
              currentMeta = {};
            }
            currentMeta.bc_id = String(clinic.ma);
            const updatedMetaStr = JSON.stringify(currentMeta);

            // Cào trang chi tiết cơ sở y tế
            const clinicUrl = `https://bookingcare.vn/co-so-y-te/${clinic.url}-p${clinic.ma}`;
            console.log(`       -> Đang tải trang chi tiết cơ sở y tế: ${clinicUrl}`);
            
            const clinicDetailData = await getNextData(clinicUrl);
            await sleep(1000);

            if (clinicDetailData && clinicDetailData.data) {
              const placeData = clinicDetailData.data;
              const desc = placeData.desc || '';
              
              // Gộp các khối thông tin info của BookingCare thành một bài viết chi tiết
              let descriptionDetail = '';
              if (placeData.info && Array.isArray(placeData.info)) {
                descriptionDetail = placeData.info
                  .map(block => `<h2>${block.title}</h2>\n${block.content}`)
                  .join('\n\n');
              }

              // Cập nhật cơ sở y tế
              await pool.query(
                `UPDATE tbl_clinic_place 
                 SET description = $1, description_detail = $2, metadata = $3 
                 WHERE id = $4`,
                [desc, descriptionDetail, updatedMetaStr, localClinic.id]
              );
              clinicsUpdated++;
              console.log(`       [DB] Đã cập nhật giới thiệu chi tiết cho cơ sở y tế ${localClinic.name}`);
            } else {
              console.log(`       -> Lỗi: Không thể tải chi tiết cơ sở y tế ${localClinic.name}`);
            }
          }
        }
      }
    }

    console.log('\n=== HOÀN THÀNH CÔNG VIỆC ===');
    console.log(`Đã cập nhật chi tiết cho ${doctorsUpdated} bác sĩ.`);
    console.log(`Đã cập nhật chi tiết cho ${clinicsUpdated} cơ sở y tế.`);

  } catch (err) {
    console.error('Lỗi nghiêm trọng trong quá trình cào:', err.message);
  } finally {
    process.exit(0);
  }
}

scrapeDetails();
