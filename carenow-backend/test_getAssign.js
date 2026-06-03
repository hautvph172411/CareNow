const service = require('./src/modules/auth/auth_item.service');

async function test() {
  const data = await service.getUserItems(10);
  console.log("Assignments:", data);
  const items = await service.getAllItems();
  console.log("Items:", items.map(i => i.name));
  process.exit();
}
test();
