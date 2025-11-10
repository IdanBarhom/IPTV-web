const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const channelsRouter = require('./routes/channels');

// Main route
app.get('/', (req, res) => {
  res.json({ 
    message: 'IPTV API Server',
    version: '1.0.0',
    endpoints: {
      channels: '/api/channels',
      users: '/api/users (coming soon)',
      auth: '/api/auth (coming soon)'
    }
  });
});

// Connect routes
app.use('/api/channels', channelsRouter);

// 404 error handler middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});