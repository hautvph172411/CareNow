const service = require('./src/modules/user/user.service');

async function test() {
  try {
    const user = await service.login('dongdohosspital', '123456');
    console.log("Login Success:", user);
  } catch (err) {
    console.error("Login Error:", err.message);
  }
  process.exit();
}
test();
