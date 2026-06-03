const { getUserPermissions } = require('./src/modules/auth/auth_item.service');

async function test() {
  try {
    const perms4 = await getUserPermissions(4);
    console.log("Permissions for user 4 (number):", perms4);
    const perms4str = await getUserPermissions('4');
    console.log("Permissions for user 4 (string):", perms4str);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
