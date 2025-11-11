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
const authRouter = require('./routes/auth');
const xtreamRouter = require('./routes/xtream');

// Main route
app.get('/', (req, res) => {
  res.json({ 
    message: 'IPTV Xtream Codes API Server',
    version: '1.0.0',
    endpoints: {
      auth: {
        connect: 'POST /api/auth/connect',
        serverInfo: 'GET /api/auth/server-info',
        disconnect: 'POST /api/auth/disconnect'
      },
      xtream: {
        liveCategories: 'GET /api/xtream/live-categories',
        liveStreams: 'GET /api/xtream/live-streams',
        vodCategories: 'GET /api/xtream/vod-categories',
        vodStreams: 'GET /api/xtream/vod-streams',
        seriesCategories: 'GET /api/xtream/series-categories',
        epg: 'GET /api/xtream/epg/:stream_id',
        streamUrl: 'GET /api/xtream/stream-url/:stream_id'
      }
    }
  });
});

// Connect routes
app.use('/api/auth', authRouter);
app.use('/api/xtream', xtreamRouter);

// 404 error handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📺 Xtream Codes API Ready`);
});