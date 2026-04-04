export const requireXtream = (req, res, next) => {
  if (req.connection.type !== 'xtream') {
    return res.status(400).json({ error: 'This endpoint requires an Xtream Codes connection' });
  }
  next();
};

export const requireM3U = (req, res, next) => {
  if (req.connection.type !== 'm3u') {
    return res.status(400).json({ error: 'This endpoint requires an M3U connection' });
  }
  next();
};
