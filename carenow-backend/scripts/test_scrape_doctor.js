const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function main() {
  const targetUrl = 'https://bookingcare.vn/dich-vu-y-te/kham-chuyen-khoa/bscki-duong-duy-khuong-i4141';
  const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
  console.log('Fetching doctor via proxy:', proxyUrl);
  try {
    const { data } = await axios.get(proxyUrl, { timeout: 15000 });
    const $ = cheerio.load(data);
    const script = $('#__NEXT_DATA__').html();
    if (script) {
      const parsed = JSON.parse(script);
      const docData = parsed.props.pageProps.data?.data || parsed.props.pageProps.initialState || parsed.props.pageProps.data;
      fs.writeFileSync('scraped_doctor.json', JSON.stringify(docData, null, 2));
      console.log('Successfully saved to scraped_doctor.json');
    } else {
      console.log('No __NEXT_DATA__ found');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
