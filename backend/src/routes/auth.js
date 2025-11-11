const express = require('express');
const router = express.Router();
const { generateToken } = require('../utils/auth');

// Store active connections (temporary - will be in database later)
let activeConnections = [];

// @route   POST /api/auth/connect
// @desc    Connect to IPTV provider using Xtream Codes API
// @access  Public
router.post('/connect', async (req, res) => {
  try {
    const { url, username, password } = req.body;

    // Validation
    if (!url || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide URL, username and password'
      });
    }

    // Build Xtream Codes API URL
    // Format: http://provider.com:port/player_api.php?username=XXX&password=XXX
    const baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
    const apiUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}`;

    // Test connection to IPTV provider
    // For now we'll simulate this - in real app you'd make actual HTTP request
    const connectionValid = await validateXtreamConnection(apiUrl);

    if (!connectionValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid IPTV credentials or server URL'
      });
    }

    // Create connection session
    const connectionId = Date.now().toString();
    const connection = {
      id: connectionId,
      url: baseUrl,
      username,
      password,
      apiUrl,
      connectedAt: new Date(),
      lastActivity: new Date()
    };

    activeConnections.push(connection);

    // Generate token for this connection
    const token = generateToken(connectionId);

    res.json({
      success: true,
      token,
      connection: {
        id: connectionId,
        url: baseUrl,
        username,
        serverInfo: {
          // This would come from real API
          serverName: 'IPTV Server',
          expiryDate: '2025-12-31',
          activeConnections: '1',
          maxConnections: '1'
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/auth/server-info
// @desc    Get IPTV server information
// @access  Private
router.get('/server-info', protect, async (req, res) => {
  try {
    const connection = activeConnections.find(c => c.id === req.connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    // In real app, fetch from Xtream API
    const serverInfo = {
      url: connection.url,
      username: connection.username,
      status: 'Active',
      expiryDate: '2025-12-31',
      isTrial: false,
      activeCons: '1',
      maxConnections: '1',
      allowedFormats: ['m3u8', 'ts', 'rtmp']
    };

    res.json({
      success: true,
      data: serverInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/auth/disconnect
// @desc    Disconnect from IPTV
// @access  Private
router.post('/disconnect', protect, (req, res) => {
  const index = activeConnections.findIndex(c => c.id === req.connectionId);
  
  if (index !== -1) {
    activeConnections.splice(index, 1);
  }

  res.json({
    success: true,
    message: 'Disconnected successfully'
  });
});

// Helper function to validate Xtream connection
async function validateXtreamConnection(apiUrl) {
  // TODO: Implement real validation
  // Should make HTTP request to the API and check response
  // For now, return true for testing
  return true;
  
  /* Real implementation would be:
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.user_info && data.user_info.status === 'Active';
  } catch (error) {
    return false;
  }
  */
}

// Middleware to protect routes with connection token
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
    
    // For Xtream connections, we use connectionId instead of userId
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