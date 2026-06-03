const axios = require('axios');
const cheerio = require('cheerio');
const url = require('url');

async function searchYahoo(query) {
  try {
    const searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36'
      }
    });
    const $ = cheerio.load(data);
    const links = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        let cleanUrl = href;
        if (href.startsWith('https://r.search.yahoo.com/')) {
          const parts = href.split('/RU=');
          if (parts.length > 1) {
            const encoded = parts[1].split('/')[0];
            cleanUrl = decodeURIComponent(encoded);
          }
        }
        if (cleanUrl.includes('bookingcare.vn') && !links.includes(cleanUrl)) {
          links.push(cleanUrl);
        }
      }
    });
    return links;
  } catch (err) {
    console.error(`Yahoo search error for "${query}":`, err.message);
    return [];
  }
}

async function main() {
  const q = 'site:bookingcare.vn "Dương Duy Khương"';
  console.log(`Searching: ${q}`);
  const results = await searchYahoo(q);
  results.forEach(link => {
    console.log('FOUND:', link);
  });
}

main();
