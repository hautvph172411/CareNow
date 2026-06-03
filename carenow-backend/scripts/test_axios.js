const axios = require('axios');

async function test(label, url, headers) {
  console.log(`\nTesting [${label}] url: ${url}`);
  const start = Date.now();
  try {
    const res = await axios.get(url, {
      headers,
      timeout: 10000
    });
    console.log(`[${label}] SUCCESS: status=${res.status}, length=${res.data.length}, time=${Date.now() - start}ms`);
  } catch (err) {
    console.log(`[${label}] FAILED: message="${err.message}", time=${Date.now() - start}ms`);
  }
}

async function main() {
  const commonHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  const chromeHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  // 1. Root page
  await test('Root with common headers', 'https://bookingcare.vn', commonHeaders);

  // 2. Subpage with common headers
  await test('Subpage with common headers', 'https://bookingcare.vn/co-so-y-te/phong-kham-da-lieu-tao-do-p303', commonHeaders);

  // 3. Subpage with chrome headers
  await test('Subpage with chrome headers', 'https://bookingcare.vn/co-so-y-te/phong-kham-da-lieu-tao-do-p303', chromeHeaders);
}

main();
