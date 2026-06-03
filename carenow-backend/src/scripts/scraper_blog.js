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
    console.error(`Error fetching ${url}:`, err.message);
  }
  return null;
}

function toSlug(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
}

async function insertCategory(cat) {
  const url = cat.url ? cat.url.split('/').pop() : toSlug(cat.name);
  const existing = await pool.query('SELECT id FROM tbl_blog_category WHERE url = $1', [url]);
  if (existing.rows.length > 0) return existing.rows[0].id;

  const res = await pool.query(
    `INSERT INTO tbl_blog_category (name, title, description, url, status) 
     VALUES ($1, $2, $3, $4, 1) RETURNING id`,
    [cat.name, cat.name, cat.description || '', url]
  );
  return res.rows[0].id;
}

async function scrapeBlog() {
  console.log('Bắt đầu lấy dữ liệu Cẩm nang (Blog) từ BookingCare...');
  let totalDocs = 0;

  try {
    const homeData = await getNextData('https://bookingcare.vn/cam-nang');
    if (!homeData || !homeData.data || !homeData.data.categories) {
      console.log('Không tìm thấy danh mục cẩm nang');
      return;
    }

    const categories = homeData.data.categories;
    console.log(`Tìm thấy ${categories.length} danh mục.`);

    for (let i = 0; i < Math.min(categories.length, 15); i++) {
      const cat = categories[i];
      console.log(`\n>> Đang xử lý danh mục: ${cat.name}`);
      
      const categoryId = await insertCategory(cat);

      // Fetch category page to get posts
      const catUrl = `https://bookingcare.vn/cam-nang/danh-muc/${cat.url}-i${cat.id}`;
      const catData = await getNextData(catUrl);
      
      if (!catData || !catData.data || !catData.data.blogCategories) {
        console.log('Không có bài viết nào trong danh mục này');
        continue;
      }

      const posts = catData.data.blogCategories;
      console.log(`Tìm thấy ${posts.length} bài viết. Sẽ lấy 10 bài ngẫu nhiên (hoặc đầu tiên).`);

      // Shuffle posts to get random 10
      const shuffled = posts.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 10);

      for (let j = 0; j < selected.length; j++) {
        const postMeta = selected[j];
        
        // Skip existing
        const existing = await pool.query('SELECT id FROM tbl_blog_public WHERE url = $1', [postMeta.url]);
        if (existing.rows.length > 0) {
          console.log(`   - Đã tồn tại bài viết: ${postMeta.title}`);
          continue;
        }

        console.log(`   + Cào bài: ${postMeta.title}`);
        
        // Fetch article content
        const postUrl = `https://bookingcare.vn/cam-nang/${postMeta.url}-p${postMeta.id}.html`;
        const postData = await getNextData(postUrl);

        if (!postData || !postData.data) {
          console.log(`     -> Lỗi không lấy được nội dung bài viết ${postUrl}`);
          continue;
        }

        const postDetail = postData.data;
        const imageUrl = await uploadImage(postDetail.picture || postMeta.picture, 'blogs');
        
        // Cần truyền blog_category_id không? Trong schema tbl_blog_public không thấy trường category_id. 
        // Thay vào đó có bảng trung gian hoặc trường khác, nhưng theo repository thì không thấy join với category.
        // Tạm thời chỉ insert vào tbl_blog_public.
        
        await pool.query(
          `INSERT INTO tbl_blog_public 
          (title, summary, content, url, description, picture, picture_alt, categories, status) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)`,
          [
            postDetail.title || postMeta.title, 
            postDetail.summary || postMeta.description || '', 
            postDetail.content || '', 
            postDetail.url || postMeta.url,
            postDetail.description || '',
            imageUrl,
            postDetail.pictureAlt || '',
            String(categoryId)
          ]
        );
        totalDocs++;
      }
    }

    console.log(`\n✅ HOÀN TẤT! Đã cào và lưu thành công ${totalDocs} bài viết cẩm nang.`);

  } catch (err) {
    console.error('Lỗi scrape blog:', err.message);
  }
}

scrapeBlog().then(() => {
  console.log('Xong');
  process.exit(0);
});
