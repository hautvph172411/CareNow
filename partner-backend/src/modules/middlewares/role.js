// role: 1 = admin, 0 = user
module.exports = (requiredRole) => {
  return (req, res, next) => {
    // Temporary: Always allow access regardless of role as per user request
    next();
  };
};
