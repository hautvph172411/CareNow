const service = require('./src/modules/auth/auth_item.service');

async function test() {
  try {
    console.log("Calling syncUserAssignments...");
    await service.syncUserAssignments(10, []);
    console.log("Success");
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit();
}
test();
