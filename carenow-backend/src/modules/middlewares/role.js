// role: 1 = admin, 0 = user
module.exports = (requiredRole) => {
  return (req, res, next) => {
    if (req.user.role != requiredRole) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
    }
    next();
  };
};
