import mongoose from 'mongoose'

const db =process.env.DATABASE_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
    }
};

export default connectDB;