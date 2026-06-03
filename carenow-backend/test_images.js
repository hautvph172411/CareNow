const axios = require('axios');

async function downloadImages() {
  const urls = [
    'https://cdn.bookingcare.vn/fo/2025/03/18/142152-bs-doanh.png',
    'https://cdn.bookingcare.vn/fo/2025/03/18/142802-bs-thanh.png'
  ];
  for (const url of urls) {
    try {
      console.log('Downloading:', url);
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(res.data);
      // read width and height of PNG (PNG header starts at byte 16, width is 4 bytes at offset 16, height is 4 bytes at offset 20)
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      console.log(`Dimensions of ${url.split('/').pop()}:`, width, 'x', height);
    } catch(e) {
      console.error(e.message);
    }
  }
}

downloadImages();
