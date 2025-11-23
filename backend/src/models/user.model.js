import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minLength: [3, 'Username must be at least 3 characters long'],
    maxLength: [30, 'Username cannot exceed 30 characters'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'], 
  },
  url:{
    type: String,
    required: [true, 'URL is required'],
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;