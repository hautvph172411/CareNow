const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/users/login', {
      username: 'dongdohosspital',
      password: '123456'
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error message:", err.message);
    if (err.response) {
      console.error("Response status:", err.response.status);
      console.error("Response data:", err.response.data);
    }
  }
}
test();
