const axios = require('axios');
const cheerio = require('cheerio');

async function main() {
  const doctorUrl = 'https://bookingcare.vn/dich-vu-y-te/kham-chuyen-khoa/bscki-duong-duy-khuong-i4141';
  const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(doctorUrl)}`;
  
  console.log('Fetching doctor detail via proxy:', proxyUrl);
  try {
    const res = await axios.get(proxyUrl, {
      timeout: 10000
    });
    console.log('Status:', res.status);
    const $ = cheerio.load(res.data);
    const script = $('#__NEXT_DATA__').html();
    if (script) {
      const parsed = JSON.parse(script);
      const docData = parsed.props.pageProps.data?.data || parsed.props.pageProps.initialState || parsed.props.pageProps.data;
      console.log('Keys in docData:', Object.keys(docData));
      console.log('Doctor name in JSON:', docData.name);
      console.log('Doctor description length:', docData.description ? docData.description.length : 0);
      console.log('Has info:', !!docData.info);
    } else {
      console.log('No __NEXT_DATA__ found');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
