import prisma from '../database/prisma.js';

export const getConnections = async (req, res, next) => {
  try {
    const connection = await prisma.iptvConnection.findUnique({
      where: { id: req.connection.id },
      omit: { password: true, rawUserInfo: true, rawServerInfo: true },
    });
    res.status(200).json({
      success: true,
      data: connection ? [connection] : [],
    });
  } catch (error) {
    next(error);
  }
};

export const getConnection = async (req, res, next) => {
  try {
    const connection = await prisma.iptvConnection.findUnique({
      where: { id: req.params.id },
      omit: { rawUserInfo: true, rawServerInfo: true },
    });
    if (!connection) {
      const error = new Error('Connection not found');
      error.status = 404;
      throw error;
    }
    res.status(200).json({ success: true, data: connection });
  } catch (error) {
    next(error);
  }
};
