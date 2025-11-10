const express = require('express');
const router = express.Router();

// Get active connections from auth
const getConnection = (connectionId) => {
  // Import from auth route (in real app would be in database)
  return null; // Placeholder
};

// @route   GET /api/xtream/live-categories
// @desc    Get live TV categories
// @access  Private
router.get('/live-categories', protect, async (req, res) => {
  try {
    // In real app: fetch from Xtream API
    // URL format: {base_url}/player_api.php?username=X&password=X&action=get_live_categories
    
    const categories = [
      { category_id: '1', category_name: 'Sports', parent_id: 0 },
      { category_id: '2', category_name: 'News', parent_id: 0 },
      { category_id: '3', category_name: 'Movies', parent_id: 0 },
      { category_id: '4', category_name: 'Kids', parent_id: 0 }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// @route   GET /api/xtream/live-streams
// @desc    Get live TV streams
// @access  Private
router.get('/live-streams', protect, async (req, res) => {
  try {
    const { category_id } = req.query;
    
    // In real app: fetch from Xtream API
    // URL format: {base_url}/player_api.php?username=X&password=X&action=get_live_streams&category_id=X
    
    const streams = [
      {
        num: 1,
        name: 'CNN International',
        stream_type: 'live',
        stream_id: 1001,
        stream_icon: 'http://example.com/logo.png',
        epg_channel_id: 'cnn.int',
        category_id: '2',
        is_adult: '0'
      },
      {
        num: 2,
        name: 'BBC News',
        stream_type: 'live',
        stream_id: 1002,
        stream_icon: 'http://example.com/bbc.png',
        epg_channel_id: 'bbc.news',
        category_id: '2',
        is_adult: '0'
      }
    ];

    // Filter by category if provided
    let filteredStreams = streams;
    if (category_id) {
      filteredStreams = streams.filter(s => s.category_id === category_id);
    }

    res.json({
      success: true,
      count: filteredStreams.length,
      data: filteredStreams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch streams'
    });
  }
});

// @route   GET /api/xtream/vod-categories
// @desc    Get VOD (movies/series) categories
// @access  Private
router.get('/vod-categories', protect, async (req, res) => {
  try {
    const categories = [
      { category_id: '10', category_name: 'Action', parent_id: 0 },
      { category_id: '11', category_name: 'Comedy', parent_id: 0 },
      { category_id: '12', category_name: 'Drama', parent_id: 0 },
      { category_id: '13', category_name: 'Horror', parent_id: 0 }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch VOD categories'
    });
  }
});

// @route   GET /api/xtream/vod-streams
// @desc    Get VOD streams (movies)
// @access  Private
router.get('/vod-streams', protect, async (req, res) => {
  try {
    const { category_id } = req.query;
    
    const movies = [
      {
        num: 1,
        name: 'Sample Movie 2024',
        stream_type: 'movie',
        stream_id: 5001,
        stream_icon: 'http://example.com/movie1.jpg',
        rating: '8.5',
        category_id: '10',
        container_extension: 'mp4'
      }
    ];

    res.json({
      success: true,
      data: movies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch VOD streams'
    });
  }
});

// @route   GET /api/xtream/series-categories
// @desc    Get series categories
// @access  Private
router.get('/series-categories', protect, async (req, res) => {
  try {
    const categories = [
      { category_id: '20', category_name: 'Netflix', parent_id: 0 },
      { category_id: '21', category_name: 'HBO', parent_id: 0 },
      { category_id: '22', category_name: 'Disney+', parent_id: 0 }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch series categories'
    });
  }
});

// @route   GET /api/xtream/epg/:stream_id
// @desc    Get EPG for specific channel
// @access  Private
router.get('/epg/:stream_id', protect, async (req, res) => {
  try {
    const { stream_id } = req.params;
    
    // Mock EPG data
    const epg = [
      {
        id: '1',
        epg_id: '1001',
        title: 'Morning News',
        start: '2024-11-09 06:00:00',
        end: '2024-11-09 08:00:00',
        description: 'Daily morning news program',
        channel_id: stream_id
      },
      {
        id: '2',
        epg_id: '1002',
        title: 'Documentary Hour',
        start: '2024-11-09 08:00:00',
        end: '2024-11-09 09:00:00',
        description: 'Nature documentary',
        channel_id: stream_id
      }
    ];

    res.json({
      success: true,
      data: epg
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch EPG'
    });
  }
});

// @route   GET /api/xtream/stream-url/:stream_id
// @desc    Get stream URL for playing
// @access  Private
router.get('/stream-url/:stream_id', protect, async (req, res) => {
  try {
    const { stream_id } = req.params;
    const { type = 'live' } = req.query;
    
    // In real app, get connection details and build URL
    // Format: {base_url}/live/{username}/{password}/{stream_id}.m3u8
    // or: {base_url}/movie/{username}/{password}/{stream_id}.mp4
    
    const streamUrl = `http://example.com/live/username/password/${stream_id}.m3u8`;
    
    res.json({
      success: true,
      data: {
        stream_id,
        url: streamUrl,
        type
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get stream URL'
    });
  }
});

// Middleware for protection (same as in auth)
function protect(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const { verifyToken } = require('../utils/auth');
    const decoded = verifyToken(token);
    req.connectionId = decoded.userId;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

module.exports = router;