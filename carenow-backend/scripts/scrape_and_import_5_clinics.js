const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const pool = require('../src/config/database');
const { cloudinary } = require('../src/config/cloudinary');

require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function toSlug(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function splitDoctorName(fullName) {
  let title = 'Bác sĩ';
  let name = fullName.trim();

  const prefixes = [
    'Giáo sư', 'Phó Giáo sư', 'Tiến sĩ', 'Thạc sĩ', 'Bác sĩ',
    'Chuyên khoa I', 'Chuyên khoa II', 'CKI', 'CKII', 'BSCKI', 'BSCKII',
    'GS', 'PGS', 'TS', 'ThS', 'BS', 'TTUT', 'TTND', 
    'Thầy thuốc', 'Ưu tú', 'Thầy', 'thuốc', 'nhân dân'
  ];

  let titleParts = [];
  let nameParts = name.split(' ');
  
  while (nameParts.length > 2) {
    let word = nameParts[0].replace(/[\.,]/g, '');
    let isPrefix = prefixes.some(p => p.toLowerCase() === word.toLowerCase() || p.toLowerCase().includes(word.toLowerCase()));
    if (isPrefix || word === word.toUpperCase()) {
      titleParts.push(nameParts.shift());
    } else {
      break;
    }
  }

  if (titleParts.length > 0) {
    title = titleParts.join(' ').trim();
    name = nameParts.join(' ').trim();
  }

  return { title, name: name || fullName };
}

function isDoctorRecord(name, url) {
  const nameLower = name.toLowerCase();
  const urlLower = url.toLowerCase();
  
  const docKeywords = [
    'bs', 'bác sĩ', 'ths', 'thạc sĩ', 'ts', 'tiến sĩ', 
    'pgs', 'phó giáo sư', 'gs', 'giáo sư', 'ck1', 'cki', 
    'ck2', 'ckii', 'nha sĩ', 'thầy thuốc', 'lương y'
  ];
  
  const serviceKeywords = [
    'khám da liễu tại', 'khám chuyên khoa', 'khám tổng quát', 
    'gói khám', 'dịch vụ', 'chương trình', 'chi phí', 'đăng ký'
  ];
  
  const hasDocKeyword = docKeywords.some(keyword => {
    return nameLower.includes(keyword) || urlLower.includes(keyword);
  });
  
  const hasServiceKeyword = serviceKeywords.some(keyword => {
    return nameLower.includes(keyword);
  });
  
  return hasDocKeyword && !hasServiceKeyword;
}

async function uploadImageToCloudinary(imageUrl, folder = 'carenow/places') {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('/')) {
    imageUrl = 'https://bookingcare.vn' + imageUrl;
  }
  if (imageUrl.includes('res.cloudinary.com')) {
    return imageUrl;
  }
  try {
    const res = await cloudinary.uploader.upload(imageUrl, { folder });
    return res.secure_url;
  } catch (err) {
    console.error(`  [Cloudinary] Lỗi upload ảnh (${imageUrl}):`, err.message);
    return imageUrl;
  }
}

async function processHtmlImagesAndUpload(htmlContent, folder = 'carenow/places') {
  if (!htmlContent) return '';
  const $ = cheerio.load(htmlContent, null, false);
  const images = $('img');
  
  for (let i = 0; i < images.length; i++) {
    const img = $(images[i]);
    const src = img.attr('data-src') || img.attr('src');
    if (src && !src.includes('loading.svg')) {
      console.log(`     Uploading inline content image to Cloudinary: ${src.substring(0, 80)}...`);
      const cloudinaryUrl = await uploadImageToCloudinary(src, folder);
      img.attr('src', cloudinaryUrl);
      img.removeAttr('data-src');
      img.removeAttr('data-srcset');
      img.removeAttr('class');
    }
  }
  return $.html();
}

async function getOrCreateWard(address, provinceId) {
  const addressLower = address.toLowerCase();
  let wardName = '';
  let wardUrl = '';
  let wardType = 'phuong';
  
  if (addressLower.includes('nhân chính') || addressLower.includes('ngụy như kon tum')) {
    wardName = 'Phường Nhân Chính';
    wardUrl = 'phuong-nhan-chinh';
    provinceId = 1;
  } else if (addressLower.includes('võ thị sáu') || addressLower.includes('xuân hòa') || addressLower.includes('ngô thời nhiệm') || addressLower.includes('nam kỳ khởi nghĩa')) {
    wardName = 'Phường Võ Thị Sáu';
    wardUrl = 'phuong-vo-thi-sau';
    provinceId = 5;
  } else if (addressLower.includes('bình trị đông b')) {
    wardName = 'Phường Bình Trị Đông B';
    wardUrl = 'phuong-binh-tri-dong-b';
    provinceId = 5;
  } else if (addressLower.includes('an lợi đông')) {
    wardName = 'Phường An Lợi Đông';
    wardUrl = 'phuong-an-loi-dong';
    provinceId = 5;
  } else if (addressLower.includes('tân sơn hòa')) {
    wardName = 'Phường Tân Sơn Hòa';
    wardUrl = 'phuong-tan-son-hoa';
    provinceId = 5;
  }
  
  if (!wardName) {
    return null;
  }
  
  const res = await pool.query(
    'SELECT id FROM tbl_location_ward WHERE name = $1 AND province_id = $2',
    [wardName, provinceId]
  );
  if (res.rows.length > 0) {
    return res.rows[0].id;
  }
  
  const insertRes = await pool.query(
    'INSERT INTO tbl_location_ward (name, url, type, province_id) VALUES ($1, $2, $3, $4) RETURNING id',
    [wardName, wardUrl, wardType, provinceId]
  );
  console.log(`  [Location] Đã thêm phường/xã thiếu: ${wardName} (ID: ${insertRes.rows[0].id})`);
  return insertRes.rows[0].id;
}

async function getOrCreateSpecialty(specName) {
  if (!specName) return null;
  const res = await pool.query(
    'SELECT id FROM tbl_clinic_specialist WHERE name ILIKE $1',
    [specName]
  );
  if (res.rows.length > 0) {
    return res.rows[0].id;
  }
  const url = toSlug(specName);
  const insertRes = await pool.query(
    'INSERT INTO tbl_clinic_specialist (name, url, status) VALUES ($1, $2, 1) RETURNING id',
    [specName, url]
  );
  console.log(`  [Specialty] Đã thêm chuyên khoa thiếu: ${specName} (ID: ${insertRes.rows[0].id})`);
  return insertRes.rows[0].id;
}

async function getNextDataViaProxy(url) {
  const proxies = [
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
  ];
  
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const getProxyUrl of proxies) {
      const proxyUrl = getProxyUrl(url);
      try {
        console.log(`   [Fetcher] Requesting via proxy (Attempt ${attempt+1}): ${proxyUrl.substring(0, 80)}...`);
        const { data } = await axios.get(proxyUrl, { timeout: 15000 });
        if (data) {
          const html = typeof data === 'string' ? data : (data.contents || '');
          if (html.includes('__NEXT_DATA__')) {
            const $ = cheerio.load(html);
            const script = $('#__NEXT_DATA__').html();
            if (script) {
              const parsed = JSON.parse(script);
              const extracted = parsed.props.pageProps.data?.data || parsed.props.pageProps.initialState || parsed.props.pageProps.data;
              if (extracted) {
                return extracted;
              }
            }
          }
        }
      } catch (err) {
        console.log(`   [Fetcher] Proxy failed or returned error: ${err.message}`);
      }
      await sleep(1000);
    }
  }
  return null;
}

const TARGETS = [
  {
    name: 'Hệ thống Y khoa Chuyên sâu Quốc tế BERNARD',
    url: 'https://bookingcare.vn/co-so-y-te/he-thong-y-khoa-chuyen-sau-quoc-te-bernard-p374',
    bc_id: 374,
    province_id: 5
  },
  {
    name: 'Bệnh viện Gia An 115',
    url: 'https://bookingcare.vn/co-so-y-te/benh-vien-gia-an-115-p398',
    bc_id: 398,
    province_id: 5
  },
  {
    name: 'Nha khoa Trẻ',
    url: 'https://bookingcare.vn/co-so-y-te/nha-khoa-tre-p47',
    bc_id: 47,
    province_id: 1
  },
  {
    name: 'Dr. Eye - Chuyên Gia Chống Lão Hóa Vùng Mắt',
    url: 'https://bookingcare.vn/co-so-y-te/dr-eye--chuyen-gia-chong-lao-hoa-vung-mat-p1138',
    bc_id: 1138,
    province_id: 5
  },
  {
    name: 'Phòng khám Da liễu Táo Đỏ',
    url: 'https://bookingcare.vn/co-so-y-te/phong-kham-da-lieu-tao-do-p303',
    bc_id: 303,
    province_id: 5
  }
];

async function run() {
  console.log('=== KHỞI CHẠY TIẾN TRÌNH CÀO & IMPORT 5 CSYT & BÁC SĨ ===\n');
  
  try {
    for (const target of TARGETS) {
      console.log(`\n>> Đang xử lý Cơ sở: ${target.name}`);
      console.log(`   URL: ${target.url}`);
      
      const placeData = await getNextDataViaProxy(target.url);
      await sleep(1500); // Throttling delay
      
      if (!placeData || !placeData.name) {
        console.log(`   [FAIL] Không thể lấy dữ liệu cho cơ sở: ${target.name}`);
        continue;
      }
      
      const rawAddress = placeData.address || placeData.addressDisplay || '';
      console.log(`   Địa chỉ thô: ${rawAddress}`);
      
      // Match or Create Ward and Province
      const wardId = await getOrCreateWard(rawAddress, target.province_id);
      console.log(`   Resolved Location -> Province ID: ${target.province_id}, Ward ID: ${wardId}`);
      
      // Upload Logo to Cloudinary
      console.log('   Đang xử lý Logo...');
      const cloudinaryLogo = await uploadImageToCloudinary(placeData.logo, 'carenow/places');
      
      // Upload Cover to Cloudinary
      console.log('   Đang xử lý Cover Image...');
      const cloudinaryCover = await uploadImageToCloudinary(placeData.image, 'carenow/places');
      
      // Process info description HTML blocks & inline images
      console.log('   Đang xử lý bài viết giới thiệu chi tiết (HTML)...');
      const extractedImages = [];
      let descriptionDetail = '';
      
      if (placeData.info && Array.isArray(placeData.info)) {
        for (const block of placeData.info) {
          if (!block.content) continue;
          
          const $ = cheerio.load(block.content, null, false);
          
          // Collect images to upload
          const imgs = $('img');
          for (let i = 0; i < imgs.length; i++) {
            const img = $(imgs[i]);
            const src = img.attr('data-src') || img.attr('src');
            if (src && !src.includes('loading.svg')) {
              console.log(`     Uploading content image to Cloudinary: ${src.substring(0, 60)}...`);
              const cloudinaryUrl = await uploadImageToCloudinary(src, 'carenow/places');
              img.attr('src', cloudinaryUrl);
              img.removeAttr('data-src');
              img.removeAttr('data-srcset');
              img.removeAttr('class');
              
              if (!extractedImages.includes(cloudinaryUrl)) {
                extractedImages.push(cloudinaryUrl);
              }
            }
          }
          
          descriptionDetail += `<h2>${block.title}</h2>\n${$.html()}\n\n`;
        }
      }
      
      // Build unique images list (cover image as first, followed by content images)
      const imagesList = [];
      if (cloudinaryCover) {
        imagesList.push(cloudinaryCover);
      }
      extractedImages.forEach(img => {
        if (!imagesList.includes(img)) {
          imagesList.push(img);
        }
      });
      const imagesStr = imagesList.length > 0 ? JSON.stringify(imagesList) : '';
      
      // Construct metadata JSON
      const metadata = {
        import_source: 'bookingcare_scraped',
        bc_id: String(target.bc_id),
        address_display: rawAddress
      };
      if (placeData.latitude) metadata.latitude = Number(placeData.latitude);
      if (placeData.longitude) metadata.longitude = Number(placeData.longitude);
      const metadataStr = JSON.stringify(metadata);
      
      // Check if place already exists in DB
      const slug = toSlug(placeData.url || placeData.name);
      const checkPlace = await pool.query('SELECT id FROM tbl_clinic_place WHERE url = $1', [slug]);
      
      let placeId = null;
      const nowEpoch = Math.floor(Date.now() / 1000);
      
      if (checkPlace.rows.length > 0) {
        placeId = checkPlace.rows[0].id;
        console.log(`   [DB] Cơ sở đã tồn tại (ID: ${placeId}). Đang cập nhật...`);
        await pool.query(
          `UPDATE tbl_clinic_place 
           SET name = $1, display_name = $2, province_id = $3, district_id = $4, address = $5, 
               logo = $6, images = $7, description_detail = $8, metadata = $9, updated_at = $10
           WHERE id = $11`,
          [
            placeData.name, placeData.name, target.province_id, wardId, rawAddress, 
            cloudinaryLogo, imagesStr, descriptionDetail, metadataStr, nowEpoch, placeId
          ]
        );
      } else {
        console.log('   [DB] Đang tạo cơ sở y tế mới...');
        const insertPlaceRes = await pool.query(
          `INSERT INTO tbl_clinic_place (
             name, display_name, province_id, district_id, address, status, 
             created_at, updated_at, images, url, description_detail, logo, 
             page_type, place_kind, page_content_blocks, metadata
           ) VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8, $9, $10, $11, 0, 3, '[]'::jsonb, $12)
           RETURNING id`,
          [
            placeData.name, placeData.name, target.province_id, wardId, rawAddress, 
            nowEpoch, nowEpoch, imagesStr, slug, descriptionDetail, cloudinaryLogo, metadataStr
          ]
        );
        placeId = insertPlaceRes.rows[0].id;
        console.log(`   [DB] Đã thêm cơ sở y tế mới thành công! (ID: ${placeId})`);
      }
      
      // --- DOCTOR SCRAPING SECTION ---
      console.log('   --- ĐANG LỌC VÀ CÀO DANH SÁCH BÁC SĨ ---');
      const doctorSection = placeData.clinics?.find(c => c.type === 1 || c.title === 'Bác sĩ');
      const rawDoctors = doctorSection?.data || [];
      console.log(`   Tìm thấy ${rawDoctors.length} bản ghi bác sĩ/dịch vụ tại cơ sở này.`);
      
      let doctorsImported = 0;
      
      for (const rawDoc of rawDoctors) {
        const docName = rawDoc.name || rawDoc.title || '';
        const docUrlSlug = rawDoc.url || '';
        
        // Skip service landing pages that don't represent a specific doctor
        if (!isDoctorRecord(docName, docUrlSlug)) {
          console.log(`     -> Bỏ qua bản ghi dịch vụ (không phải bác sĩ): ${docName}`);
          continue;
        }
        
        console.log(`     + Bác sĩ phát hiện: ${docName}`);
        
        // Detailed Doctor URL
        const docUrl = `https://bookingcare.vn/dich-vu-y-te/kham-chuyen-khoa/${docUrlSlug}-i${rawDoc.id}`;
        console.log(`       Cào chi tiết bác sĩ: ${docUrl}`);
        
        const docData = await getNextDataViaProxy(docUrl);
        await sleep(1500); // Throttling delay
        
        if (!docData || !docData.ten) {
          console.log(`       [FAIL] Không lấy được chi tiết bác sĩ: ${docName}`);
          continue;
        }
        
        const { title, name } = splitDoctorName(docData.ten);
        console.log(`       Tách danh xưng: "${title}", Tên: "${name}"`);
        
        // Upload Avatar (anh) to Cloudinary
        console.log('       Đang xử lý ảnh đại diện bác sĩ...');
        const cloudinaryAvatar = await uploadImageToCloudinary(docData.anh, 'carenow/doctors');
        
        // Process inline HTML description (noidung) & upload images
        console.log('       Đang xử lý bài giới thiệu bác sĩ (HTML)...');
        const cleanContentHtml = await processHtmlImagesAndUpload(docData.noidung || '', 'carenow/doctors');
        
        // Resolve Specialties
        const specialtyIds = [];
        if (docData.chuyenkhoa && Array.isArray(docData.chuyenkhoa)) {
          for (const spec of docData.chuyenkhoa) {
            const specId = await getOrCreateSpecialty(spec.ten);
            if (specId && !specialtyIds.includes(specId)) {
              specialtyIds.push(specId);
            }
          }
        }
        const specialistIdsStr = specialtyIds.join(',');
        
        // Find price_min
        let priceMin = 150000;
        if (docData.lichkham) {
          let foundPrices = [];
          for (const dayKey of Object.keys(docData.lichkham)) {
            const day = docData.lichkham[dayKey];
            if (day && day.buoi && typeof day.buoi === 'object') {
              for (const buoiKey of Object.keys(day.buoi)) {
                const buoi = day.buoi[buoiKey];
                if (buoi && buoi.gia_thapnhat) {
                  foundPrices.push(Number(buoi.gia_thapnhat));
                }
              }
            }
          }
          if (foundPrices.length > 0) {
            priceMin = Math.min(...foundPrices);
          }
        }
        
        // Metadata
        const docMetadataStr = JSON.stringify({
          import_source: 'bookingcare_scraped',
          bc_id: String(rawDoc.id),
          tinhthanh: docData.tinhthanh || ''
        });
        
        // Check if doctor exists in DB
        const checkDoc = await pool.query('SELECT id, place_ids FROM tbl_clinic WHERE url = $1', [docUrlSlug]);
        
        if (checkDoc.rows.length > 0) {
          const docId = checkDoc.rows[0].id;
          let currentPlaces = checkDoc.rows[0].place_ids || '';
          
          // Retrieve partner_id of the clinic place
          const placePartnerRes = await pool.query('SELECT partner_id FROM tbl_clinic_place WHERE id = $1', [placeId]);
          const dbPartnerId = placePartnerRes.rows[0]?.partner_id;

          // Append placeId if not already linked
          const placesList = currentPlaces.split(',').filter(Boolean);
          if (!placesList.includes(String(placeId))) {
            placesList.push(String(placeId));
          }
          const updatedPlacesStr = placesList.join(',');
          
          console.log(`       [DB] Bác sĩ đã tồn tại (ID: ${docId}). Đang cập nhật liên kết địa điểm khám...`);
          await pool.query(
            `UPDATE tbl_clinic 
             SET name = $1, title = $2, picture = $3, summary = $4, content = $5, 
                 specialist_ids = $6, place_ids = $7, price_min = $8, metadata = $9, updated_at = $10,
                 address = $11, district_ids = $12, partner_ids = $13
             WHERE id = $14`,
            [
              name, title, cloudinaryAvatar, docData.tomtat || '', cleanContentHtml, 
              specialistIdsStr, updatedPlacesStr, priceMin, docMetadataStr, nowEpoch, 
              rawAddress, wardId ? String(wardId) : null, dbPartnerId ? String(dbPartnerId) : null, docId
            ]
          );
        } else {
          // Retrieve partner_id of the clinic place
          const placePartnerRes = await pool.query('SELECT partner_id FROM tbl_clinic_place WHERE id = $1', [placeId]);
          const dbPartnerId = placePartnerRes.rows[0]?.partner_id;

          console.log('       [DB] Đang tạo bác sĩ mới...');
          await pool.query(
            `INSERT INTO tbl_clinic (
               name, title, url, picture, summary, content, specialist_ids, place_ids, 
               price_min, is_work, status, created_at, updated_at, metadata, service, 
               show_phone, payment_method, show_in_root_place, province_id, address, district_ids, partner_ids
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, 1, $10, $11, $12, 1, 1, 2, 1, $13, $14, $15, $16)`,
            [
              name, title, docUrlSlug, cloudinaryAvatar, docData.tomtat || '', cleanContentHtml, 
              specialistIdsStr, String(placeId), priceMin, nowEpoch, nowEpoch, docMetadataStr, 
              target.province_id, rawAddress, wardId ? String(wardId) : null, dbPartnerId ? String(dbPartnerId) : null
            ]
          );
          console.log('       [DB] Đã thêm bác sĩ mới thành công!');
        }
        
        doctorsImported++;
      }
      
      console.log(`   [FINISH] Cơ sở: ${target.name} -> Đã import xong (${doctorsImported} bác sĩ liên kết).`);
    }
    
    // Reset DB Serial Sequences
    console.log('\n>> Đang khôi phục lại các chuỗi index serial trong database...');
    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('tbl_clinic_place', 'id'),
        COALESCE((SELECT MAX(id) FROM tbl_clinic_place), 1)
      );
    `);
    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('tbl_clinic', 'id'),
        COALESCE((SELECT MAX(id) FROM tbl_clinic), 1)
      );
    `);
    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('tbl_location_ward', 'id'),
        COALESCE((SELECT MAX(id) FROM tbl_location_ward), 1)
      );
    `);
    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('tbl_clinic_specialist', 'id'),
        COALESCE((SELECT MAX(id) FROM tbl_clinic_specialist), 1)
      );
    `);
    
    console.log('\n=== TIẾN TRÌNH HOÀN THÀNH THÀNH CÔNG ===');
    
  } catch (err) {
    console.error('\n[CRITICAL ERROR]:', err.message);
  } finally {
    pool.end();
    process.exit(0);
  }
}

run();
