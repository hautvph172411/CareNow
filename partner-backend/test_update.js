const repo = require('./src/modules/user/user.repository');
const service = require('./src/modules/user/user.service');

async function test() {
  try {
    const user = await repo.findById(10);
    console.log("Original User:", user);

    const payload = { ...user };
    delete payload.password;
    delete payload.salt;
    delete payload.role_name;

    console.log("Calling service.updateUser...");
    const updated = await service.updateUser(10, payload);
    console.log("Success:", updated);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit();
}

test();
