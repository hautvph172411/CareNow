const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Temporary: Always allow access without token as per user request
  req.user = { id: 1, username: 'dev_admin', role: 1 };
  next();
};
