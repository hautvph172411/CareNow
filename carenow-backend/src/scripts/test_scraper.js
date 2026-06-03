const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://bookingcare.vn', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
}).then(r => {
  const $ = cheerio.load(r.data);
  const data = $('#__NEXT_DATA__').html();
  if (data) {
    console.log('YES', data.substring(0, 100));
  } else {
    console.log('NO');
  }
}).catch(console.error);
