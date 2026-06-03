const { cloudinary } = require('../src/config/cloudinary');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

async function main() {
  const remoteUrl = 'https://cdn.bookingcare.vn/fo/2024/07/18/114029-anh1.jpg';
  console.log('Testing remote Cloudinary upload for:', remoteUrl);
  try {
    const res = await cloudinary.uploader.upload(remoteUrl, {
      folder: 'carenow/test_places'
    });
    console.log('Upload SUCCESS!');
    console.log('Secure URL:', res.secure_url);
  } catch (err) {
    console.error('Upload FAILED:', err.message);
  }
}

main();
