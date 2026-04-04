export const requireAdmin = (req, res, next) => {
  if (!req.connection?.isAdmin) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};
