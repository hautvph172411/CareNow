const axios = require('axios');

async function testProxy(name, url) {
  console.log(`Testing [${name}] URL: ${url}`);
  const start = Date.now();
  try {
    const res = await axios.get(url, { timeout: 10000 });
    console.log(`[${name}] SUCCESS: status=${res.status}, length=${typeof res.data === 'string' ? res.data.length : JSON.stringify(res.data).length}, time=${Date.now() - start}ms`);
    return res.data;
  } catch (err) {
    console.log(`[${name}] FAILED: message="${err.message}", time=${Date.now() - start}ms`);
    return null;
  }
}

async function main() {
  const target = 'https://bookingcare.vn/co-so-y-te/phong-kham-da-lieu-tao-do-p303';
  
  const proxies = [
    { name: 'corsproxy.io', url: `https://corsproxy.io/?${encodeURIComponent(target)}` },
    { name: 'codetabs', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}` },
    { name: 'allorigins-hex', url: `https://api.allorigins.win/get?url=${encodeURIComponent(target)}` },
  ];

  for (const p of proxies) {
    const data = await testProxy(p.name, p.url);
    if (data) {
      // Check if __NEXT_DATA__ is in contents
      const html = typeof data === 'string' ? data : (data.contents || '');
      if (html.includes('__NEXT_DATA__')) {
        console.log(`[${p.name}] Found __NEXT_DATA__!`);
        break;
      } else {
        console.log(`[${p.name}] __NEXT_DATA__ NOT found in content.`);
      }
    }
  }
}

main();
