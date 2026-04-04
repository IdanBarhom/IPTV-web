import { JWT_SECRET } from '../../config/env.js';
import jwt from 'jsonwebtoken';
import prisma from '../database/prisma.js';
import { decrypt } from '../utils/encryption.js';

const authorize = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const connection = await prisma.iptvConnection.findUnique({
      where: { id: decoded.connectionId },
    });

    if (!connection) {
      return res.status(401).json({ message: 'Unauthorized - connection not found' });
    }

    connection.password = decrypt(connection.password);
    req.connection = connection;
    req.user = { connectionId: connection.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized', error: error.message });
  }
};

export { authorize };
export default authorize;
