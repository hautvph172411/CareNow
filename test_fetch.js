async function test() {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  
  const usersRes = await fetch('http://localhost:3001/api/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const usersData = await usersRes.json();
  console.log(JSON.stringify(usersData, null, 2));
}
test();
