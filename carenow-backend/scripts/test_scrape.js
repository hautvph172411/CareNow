const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function main() {
  const targetUrl = 'https://bookingcare.vn/co-so-y-te/phong-kham-da-lieu-tao-do-p303';
  const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
  console.log('Fetching via proxy:', proxyUrl);
  try {
    const { data } = await axios.get(proxyUrl, { timeout: 15000 });
    const $ = cheerio.load(data);
    const script = $('#__NEXT_DATA__').html();
    if (script) {
      const parsed = JSON.parse(script);
      const placeData = parsed.props.pageProps.data?.data || parsed.props.pageProps.initialState?.place || parsed.props.pageProps.data;
      fs.writeFileSync('scraped_place.json', JSON.stringify(placeData || parsed, null, 2));
      console.log('Successfully saved to scraped_place.json');
      console.log('Keys in placeData:', placeData ? Object.keys(placeData) : 'null');
    } else {
      console.log('No __NEXT_DATA__ found');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
