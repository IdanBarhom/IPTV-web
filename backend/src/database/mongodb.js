import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Connects to MongoDB using Mongoose. Exits the process on failure.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection error');
    process.exit(1);
  }
};

export default connectDB;
