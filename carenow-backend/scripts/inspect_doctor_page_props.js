const axios = require('axios');
const cheerio = require('cheerio');

async function main() {
  const targetUrl = 'https://bookingcare.vn/bac-si/bscki-duong-duy-khuong-p4141.html';
  const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
  try {
    const { data } = await axios.get(proxyUrl, { timeout: 15000 });
    const $ = cheerio.load(data);
    const script = $('#__NEXT_DATA__').html();
    if (script) {
      const parsed = JSON.parse(script);
      console.log('Keys in parsed.props.pageProps:', Object.keys(parsed.props.pageProps));
      if (parsed.props.pageProps.data) {
        console.log('Keys in parsed.props.pageProps.data:', Object.keys(parsed.props.pageProps.data));
      }
      if (parsed.props.pageProps.initialState) {
        console.log('Keys in parsed.props.pageProps.initialState:', Object.keys(parsed.props.pageProps.initialState));
      }
    } else {
      console.log('No __NEXT_DATA__ found');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
