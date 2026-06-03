const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

const pool = require('../config/database');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function uploadImage(url, folder) {
  if (!url) return '';
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

function splitDoctorName(fullName) {
  let title = '';
  let name = fullName.trim();
  const match = name.match(/^(.*?(?:Giáo sư|Phó Giáo sư|Tiến sĩ|Thạc sĩ|Bác sĩ|BS|TS|PGS|GS|TTUT|CKII|CKI)[\.\,]*\s)+(.*)$/i);
  if (match) {
    title = match[1].trim();
    name = match[2].trim();
  } else {
    // Basic fallback
    const parts = name.split(' ');
    if (parts.length > 2 && ['BS', 'ThS', 'TS', 'PGS', 'GS'].includes(parts[0].replace(/[\.,]/g, ''))) {
      title = parts[0];
      name = parts.slice(1).join(' ');
    }
  }
  return { title, name: name || fullName };
}

async function scrapePool() {
  console.log('Bắt đầu lấy dữ liệu bác sĩ từ BookingCare...');
  const poolDoctors = [];
  
  const homeData = await getNextData('https://bookingcare.vn');
  if (!homeData || !homeData.list) {
    console.log('Không tìm thấy dữ liệu từ trang chủ');
    return [];
  }

  const specSection = homeData.list.find(s => s.header?.title === 'Chuyên khoa');
  let specialties = specSection ? specSection.data : [];
  
  // Lấy dữ liệu từ ~15 chuyên khoa để có đủ pool bác sĩ lớn
  for (let i = 0; i < Math.min(15, specialties.length); i++) {
    const spec = specialties[i];
    console.log(`Đang cào chuyên khoa: ${spec.title}`);
    
    const specUrl = spec.url.startsWith('http') ? spec.url : 'https://bookingcare.vn' + spec.url;
    const specData = await getNextData(specUrl);
    
    if (specData && specData.data && specData.data.bs) {
      const doctors = specData.data.bs;
      for (const doc of doctors) {
        if (!poolDoctors.find(d => d.url === doc.url)) {
          poolDoctors.push(doc);
        }
      }
    }
    console.log(`-> Đã gom được ${poolDoctors.length} bác sĩ unique.`);
    if (poolDoctors.length >= 300) break; // Lấy 300 bác sĩ là đủ pool để xào nấu
  }
  
  return poolDoctors;
}

function getRandomItems(array, count) {
  const shuffled = array.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function run() {
  try {
    // 1. Get all specialties
    const specRes = await pool.query('SELECT id FROM tbl_clinic_specialist');
    const allSpecIds = specRes.rows.map(r => r.id);
    console.log(`Found ${allSpecIds.length} specialties.`);

    // 2. Get all clinics
    const placeRes = await pool.query('SELECT id FROM tbl_clinic_place');
    const allPlaceIds = placeRes.rows.map(r => r.id);
    console.log(`Found ${allPlaceIds.length} clinic places.`);

    // 3. Scrape doctors pool
    const scrapedDocs = await scrapePool();
    if (scrapedDocs.length === 0) {
      console.log('Không cào được bác sĩ nào!');
      process.exit(1);
    }

    // 4. Transform scraped doctors into objects we will insert
    console.log('Đang upload ảnh lên Cloudinary... (sẽ mất một chút thời gian)');
    const finalDoctors = [];
    for (let i = 0; i < scrapedDocs.length; i++) {
      const doc = scrapedDocs[i];
      const { title, name } = splitDoctorName(doc.ten);
      console.log(`Upload ảnh ${i+1}/${scrapedDocs.length}: ${name}`);
      const imageUrl = await uploadImage(doc.anh, 'doctors');
      
      finalDoctors.push({
        id: i,
        name: name,
        title: title,
        url: doc.url,
        picture: imageUrl,
        summary: doc.tomtat || '',
        price_min: Math.floor(Math.random() * 8 + 3) * 50000,
        specialist_ids_set: new Set(),
        place_ids_set: new Set(),
        is_work: 1,
        show_phone: 1,
        payment_method: 2,
        show_in_root_place: 1,
        status: 1,
        sponsor: Math.random() > 0.8 ? 1 : 0
      });
    }

    console.log('Bắt đầu phân bổ bác sĩ theo yêu cầu...');
    // Mỗi chuyên khoa ít nhất 10 bác sĩ
    for (const sId of allSpecIds) {
      const chosenDocs = getRandomItems(finalDoctors, 10);
      for (const d of chosenDocs) {
        d.specialist_ids_set.add(sId);
      }
    }

    // Mỗi cơ sở ít nhất 3 bác sĩ
    for (const pId of allPlaceIds) {
      const chosenDocs = getRandomItems(finalDoctors, 3);
      for (const d of chosenDocs) {
        d.place_ids_set.add(pId);
      }
    }

    console.log('Tiến hành Insert vào database...');
    // 5. Insert into DB
    let count = 0;
    for (const doc of finalDoctors) {
      const specIdsStr = Array.from(doc.specialist_ids_set).join(',');
      const placeIdsStr = Array.from(doc.place_ids_set).join(',');
      
      if (!specIdsStr && !placeIdsStr) continue; // Bỏ qua nếu không được phân bổ vào đâu

      await pool.query(
        `INSERT INTO tbl_clinic 
        (name, title, url, picture, summary, specialist_ids, place_ids, price_min, is_work, show_phone, payment_method, show_in_root_place, status, sponsor) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          doc.name, doc.title, doc.url, doc.picture, doc.summary, 
          specIdsStr, 
          placeIdsStr,
          doc.price_min,
          doc.is_work, doc.show_phone, doc.payment_method, doc.show_in_root_place, doc.status, doc.sponsor
        ]
      );
      count++;
    }

    console.log(`✅ HOÀN TẤT! Đã insert thành công ${count} bác sĩ.`);

  } catch (e) {
    console.error("Lỗi:", e);
  } finally {
    process.exit(0);
  }
}

run();
