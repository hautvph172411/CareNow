const axios = require('axios');

async function main() {
  const targetUrl = 'https://bookingcare.vn/co-so-y-te/phong-kham-da-lieu-tao-do-p303';
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
  
  console.log('Fetching via proxy:', proxyUrl);
  try {
    const res = await axios.get(proxyUrl, { timeout: 15000 });
    console.log('Status:', res.status);
    if (res.data && res.data.contents) {
      console.log('Received contents length:', res.data.contents.length);
      // Try to find __NEXT_DATA__
      const cheerio = require('cheerio');
      const $ = cheerio.load(res.data.contents);
      const nextData = $('#__NEXT_DATA__').html();
      console.log('__NEXT_DATA__ found:', !!nextData);
      if (nextData) {
        console.log('__NEXT_DATA__ snippet:', nextData.slice(0, 200));
      }
    } else {
      console.log('No contents field in response');
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

main();
