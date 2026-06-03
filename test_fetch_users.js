const axios = require('axios');
async function test() {
  try {
    const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: '123'
    });
    const token = loginRes.data.data.token;
    console.log("Token acquired.");
    
    const usersRes = await axios.get('http://localhost:3001/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Users response data:", JSON.stringify(usersRes.data, null, 2));
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
