const axios = require('axios');

async function testFetch() {
  try {
    const res = await axios.get('https://html.duckduckgo.com/html/?q=bookingcare', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
      }
    });
    console.log('DDG Status:', res.status);
    console.log('DDG Body length:', res.data.length);
  } catch (err) {
    console.error('DDG Fetch error:', err.message);
  }

  try {
    const res2 = await axios.get('https://bookingcare.vn', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
      }
    });
    console.log('BookingCare Status:', res2.status);
    console.log('BookingCare Body length:', res2.data.length);
  } catch (err) {
    console.error('BookingCare Fetch error:', err.message);
  }
}

testFetch();
