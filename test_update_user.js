const db = require('./carenow-backend/src/config/database');
const userService = require('./partner-backend/src/modules/user/user.service');

async function test() {
  try {
    // 1. Create a dummy user
    const user = await userService.createUser({
      username: 'test_staff_123',
      password: 'password123',
      partner_id: 1,
      partner_role: 'staff',
      status: 1
    });
    console.log("Created user:", user);

    // 2. Login the user
    let loggedIn = await userService.login('test_staff_123', 'password123');
    console.log("Login successful immediately after creation!");

    // 3. Update the user (e.g. change display_name, no password)
    const updated = await userService.updateUser(user.id, {
      display_name: 'Test Staff Updated',
      partner_role: 'manager'
    });
    console.log("Updated user:", updated);

    // 4. Login the user again
    loggedIn = await userService.login('test_staff_123', 'password123');
    console.log("Login successful after update!");

    // Cleanup
    await db.query('DELETE FROM tbl_user WHERE id = $1', [user.id]);
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}
test();
