const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  req.user = { id: 1, username: 'dev_admin', role: 1 };
  next();
};
