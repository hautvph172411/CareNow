const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

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
      return parsed.props.pageProps.data?.data || parsed.props.pageProps.initialState?.place || parsed.props.pageProps.data;
    }
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log(`  [Fetcher] Lỗi 404: Không tìm thấy trang ${url}`);
    } else {
      console.error(`  [Fetcher] Lỗi tải trang ${url}:`, err.message);
    }
  }
  return null;
}

async function scrapeClinicPlaces() {
  console.log('=== BẮT ĐẦU CÀO DỮ LIỆU CHI TIẾT CƠ SỞ Y TẾ ===');
  let clinicsUpdated = 0;
  
  try {
    const res = await pool.query('SELECT id, name, url, metadata FROM tbl_clinic_place WHERE status = 1');
    const clinics = res.rows;
    console.log(`Tìm thấy ${clinics.length} cơ sở y tế đang hoạt động trong database.`);

    for (const clinic of clinics) {
      console.log(`\n>> Đang xử lý: [ID: ${clinic.id}] ${clinic.name}`);
      
      if (!clinic.url) {
        console.log(`   [SKIPPED] Cơ sở y tế không có URL trong database.`);
        continue;
      }

      let bc_id = '';
      if (clinic.metadata) {
        try {
          const meta = typeof clinic.metadata === 'string' ? JSON.parse(clinic.metadata) : clinic.metadata;
          if (meta.bc_id && meta.bc_id !== '0' && meta.bc_id !== 0) bc_id = meta.bc_id;
        } catch(e) {}
      }
      
      const final_bc_id = bc_id || clinic.id;
      const urlSuffix = `${clinic.url}-p${final_bc_id}`;
      const clinicUrl = `https://bookingcare.vn/co-so-y-te/${urlSuffix}`;
      
      console.log(`   -> Đang tải trang: ${clinicUrl}`);
      const placeData = await getNextData(clinicUrl);
      await sleep(1500); // 1.5s delay to avoid ban

      if (placeData && placeData.name) {
        const address = placeData.address || placeData.addressDisplay || '';
        const logo = placeData.logo || '';
        const coverImage = placeData.image || '';
        
        // Extract all images embedded in info blocks (e.g. equipment, facility images)
        const extractedImages = [];
        let descriptionDetail = '';
        
        if (placeData.info && Array.isArray(placeData.info)) {
          descriptionDetail = placeData.info
            .map(block => {
              if (!block.content) return '';
              
              const $ = cheerio.load(block.content, null, false);
              
              // Correct lazy loading images: replace src with data-src
              $('img').each((i, img) => {
                const dataSrc = $(img).attr('data-src') || $(img).attr('src');
                if (dataSrc) {
                  // Set actual image source
                  $(img).attr('src', dataSrc);
                  // Remove lazy loading attributes to render clean HTML
                  $(img).removeAttr('data-src');
                  $(img).removeAttr('data-srcset');
                  $(img).removeAttr('class');
                  
                  if (!dataSrc.includes('loading.svg') && !extractedImages.includes(dataSrc)) {
                    extractedImages.push(dataSrc);
                  }
                }
              });
              
              return `<h2>${block.title}</h2>\n${$.html()}`;
            })
            .filter(Boolean)
            .join('\n\n');
        }

        // Build unique images list (cover image as first, followed by others)
        const imagesList = [];
        if (coverImage) {
          imagesList.push(coverImage);
        }
        extractedImages.forEach(img => {
          if (!imagesList.includes(img)) {
            imagesList.push(img);
          }
        });
        const imagesStr = imagesList.length > 0 ? JSON.stringify(imagesList) : '';

        // Update metadata with latitude/longitude
        let updatedMetadataStr = clinic.metadata;
        try {
          const meta = clinic.metadata ? (typeof clinic.metadata === 'string' ? JSON.parse(clinic.metadata) : clinic.metadata) : {};
          if (placeData.latitude) meta.latitude = Number(placeData.latitude);
          if (placeData.longitude) meta.longitude = Number(placeData.longitude);
          updatedMetadataStr = JSON.stringify(meta);
        } catch(e) {
          console.error('   Lỗi khi cập nhật metadata:', e.message);
        }

        await pool.query(
          `UPDATE tbl_clinic_place 
           SET address = COALESCE(NULLIF($1, ''), address), 
               logo = COALESCE(NULLIF($2, ''), logo),
               images = COALESCE(NULLIF($3, ''), images),
               description_detail = COALESCE(NULLIF($4, ''), description_detail),
               metadata = COALESCE(NULLIF($5, ''), metadata)
           WHERE id = $6`,
          [address, logo, imagesStr, descriptionDetail, updatedMetadataStr, clinic.id]
        );
        clinicsUpdated++;
        console.log(`   [SUCCESS] Đã cập nhật (address, logo, images count: ${imagesList.length}, description_detail, lat/lng).`);
      } else {
        console.log(`   [SKIPPED] Không lấy được dữ liệu chi tiết, có thể URL đã bị thay đổi.`);
      }
    }

    console.log('\n=== HOÀN THÀNH CÔNG VIỆC ===');
    console.log(`Đã cào và cập nhật chi tiết cho ${clinicsUpdated}/${clinics.length} cơ sở y tế.`);

  } catch (err) {
    console.error('Lỗi nghiêm trọng:', err.message);
  } finally {
    pool.end();
    process.exit(0);
  }
}

scrapeClinicPlaces();
