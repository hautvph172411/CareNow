const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const { v2: cloudinary } = require('cloudinary');

require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function uploadImage(url, folder) {
  if (!url) return '';
  // sometimes url is relative
  if (url.startsWith('/')) {
    url = 'https://bookingcare.vn' + url;
  }
  try {
    const res = await cloudinary.uploader.upload(url, { folder: `carenow/${folder}` });
    return res.secure_url;
  } catch (err) {
    console.error(`Lỗi upload ảnh (${url}):`, err.message);
    return url;
  }
}

async function getNextData(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(data);
    const script = $('#__NEXT_DATA__').html();
    if (script) {
      const parsed = JSON.parse(script);
      return parsed.props.pageProps.initialState || parsed.props.pageProps.data;
    }
  } catch (err) {
    console.error(`Error fetching ${url}:`, err.message);
  }
  return null;
}

// Hàm tách danh xưng (title) và tên (name) từ chuỗi "PGS. TS. BSCKII. TTUT Vũ Văn Hòe"
function splitDoctorName(fullName) {
  let title = '';
  let name = fullName.trim();

  // Danh sách các tiền tố thường gặp
  const prefixes = [
    'Giáo sư', 'Phó Giáo sư', 'Tiến sĩ', 'Thạc sĩ', 'Bác sĩ',
    'Chuyên khoa I', 'Chuyên khoa II', 'CKI', 'CKII', 'BSCKI', 'BSCKII',
    'GS', 'PGS', 'TS', 'ThS', 'BS', 'TTUT', 'TTND'
  ];

  // Regex để tìm phần tiền tố ở đầu chuỗi (case-insensitive, có thể có dấu chấm hoặc phẩy, khoảng trắng)
  // Thực ra chỉ cần tìm dấu chấm cuối cùng của chuỗi viết tắt hoặc tìm đoạn viết hoa
  const parts = name.split(/(?<=[\.\,])\s+/);
  
  // Dùng cách đơn giản: tách theo mảng tiền tố
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
  } else {
    // Nếu không bóc tách được bằng cách trên, thử cách tách thủ công
    const match = name.match(/^(.*?(?:Giáo sư|Phó Giáo sư|Tiến sĩ|Thạc sĩ|Bác sĩ|BS|TS|PGS|GS|TTUT|CKII|CKI)[\.\,]*\s)+(.*)$/i);
    if (match) {
      title = match[1].trim();
      name = match[2].trim();
    }
  }

  return { title, name: name || fullName };
}

function toSlug(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
}

async function insertSpecialty(spec) {
  const url = spec.url ? spec.url.split('/').pop() : toSlug(spec.title);
  const existing = await pool.query('SELECT id FROM tbl_clinic_specialist WHERE url = $1', [url]);
  if (existing.rows.length > 0) return existing.rows[0].id;

  const imageUrl = await uploadImage(spec.image, 'specialties');
  
  const res = await pool.query(
    `INSERT INTO tbl_clinic_specialist (name, url, picture, description, status) 
     VALUES ($1, $2, $3, $4, 1) RETURNING id`,
    [spec.title, url, imageUrl, spec.description || '']
  );
  return res.rows[0].id;
}

async function insertPlace(place) {
  const url = place.url ? place.url.split('/').pop() : toSlug(place.title);
  const existing = await pool.query('SELECT id FROM tbl_clinic_place WHERE url = $1', [url]);
  if (existing.rows.length > 0) return existing.rows[0].id;

  const imageUrl = await uploadImage(place.image, 'places');
  const imagesJson = JSON.stringify([imageUrl]);

  const res = await pool.query(
    `INSERT INTO tbl_clinic_place (name, display_name, url, logo, images, description, status, place_kind) 
     VALUES ($1, $2, $3, $4, $5, $6, 1, 3) RETURNING id`,
    [place.title, place.title, url, imageUrl, imagesJson, place.description || '']
  );
  return res.rows[0].id;
}

async function scrapeData() {
  console.log('Bắt đầu lấy dữ liệu từ BookingCare...');
  let totalDocs = 0;

  try {
    const homeData = await getNextData('https://bookingcare.vn');
    if (!homeData || !homeData.list) {
      console.log('Không tìm thấy dữ liệu từ trang chủ');
      return;
    }

    const specSection = homeData.list.find(s => s.header?.title === 'Chuyên khoa');
    const placeSection = homeData.list.find(s => s.header?.title === 'Cơ sở y tế');

    let specialties = specSection ? specSection.data : [];
    let places = placeSection ? placeSection.data : [];
    
    console.log(`Tìm thấy ${specialties.length} chuyên khoa và ${places.length} cơ sở y tế trên trang chủ.`);

    // 1. Lưu các cơ sở y tế
    console.log('\n--- ĐANG LƯU CƠ SỞ Y TẾ ---');
    const placeIds = [];
    for (let i = 0; i < Math.min(10, places.length); i++) {
      const p = places[i];
      console.log(`Đang lưu cơ sở: ${p.title}`);
      const pid = await insertPlace(p);
      placeIds.push(pid);
    }
    
    // 2. Lưu chuyên khoa & Bác sĩ
    console.log('\n--- ĐANG LƯU CHUYÊN KHOA VÀ BÁC SĨ ---');
    for (let i = 0; i < Math.min(20, specialties.length); i++) {
      const spec = specialties[i];
      console.log(`\n>> Chuyên khoa: ${spec.title}`);
      
      const specId = await insertSpecialty(spec);

      const specUrl = spec.url.startsWith('http') ? spec.url : 'https://bookingcare.vn' + spec.url;
      const specData = await getNextData(specUrl);
      
      if (!specData || !specData.data || !specData.data.bs) {
        console.log(' Không có danh sách bác sĩ');
        continue;
      }

      const doctors = specData.data.bs;
      
      for (let j = 0; j < doctors.length; j++) {
        const doc = doctors[j];
        const existing = await pool.query('SELECT id FROM tbl_clinic WHERE url = $1', [doc.url]);
        if (existing.rows.length > 0) continue; // Skip existing

        const { title, name } = splitDoctorName(doc.ten);
        console.log(`   + Bác sĩ: ${title} ${name}`);

        const imageUrl = await uploadImage(doc.anh, 'doctors');
        
        // Chọn random 1 cơ sở y tế
        const randomPlaceId = placeIds.length > 0 ? placeIds[Math.floor(Math.random() * placeIds.length)] : null;
        
        // Random giá khám 150k - 500k
        const price = Math.floor(Math.random() * 8 + 3) * 50000;
        
        await pool.query(
          `INSERT INTO tbl_clinic 
          (name, title, url, picture, summary, specialist_ids, place_ids, price_min, is_work, show_phone, payment_method, show_in_root_place, status, sponsor) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 1, 2, 1, 1, $9)`,
          [
            name, title, doc.url, imageUrl, doc.tomtat || '', 
            String(specId), 
            randomPlaceId ? String(randomPlaceId) : null,
            price,
            Math.random() > 0.8 ? 1 : 0 // 20% là sponsor
          ]
        );
        totalDocs++;
      }
    }

    console.log(`\n✅ HOÀN TẤT! Đã cào và lưu thành công ${totalDocs} bác sĩ.`);

  } catch (err) {
    console.error('Lỗi scrape:', err.message);
  }
}

scrapeData().then(() => {
  console.log('Xong');
  process.exit(0);
});
