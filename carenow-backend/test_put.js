const axios = require('axios');
const jwt = require('jsonwebtoken');

async function test() {
  try {
    const token = jwt.sign({ id: 1, username: 'admin', role: 1 }, 'carenow_secret_key_2024', { expiresIn: '1h' });
    
    const payload = {
      username: 'dongdohosspital',
      display_name: '123 Modified',
      role: '2',
      status: '1',
      partner_id: 4,
      email: 'dongdo@gmail.com',
      phone: '0922632691'
    };
    
    console.log("Sending PUT request with token...");
    const res = await axios.put('http://localhost:5000/api/users/10', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Response:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}
test();
