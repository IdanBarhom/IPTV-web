const express = require('express');
const router = express.Router();
const { parseM3U } = require('../utils/m3uParser');

// Temporary mock data - will be replaced with database later
let channels = [
  { 
    id: 1, 
    name: 'Channel 12', 
    url: 'http://example.com/stream1',
    category: 'Israeli',
    logo: 'https://via.placeholder.com/150',
    country: 'IL'
  },
  { 
    id: 2, 
    name: 'CNN', 
    url: 'http://example.com/stream2',
    category: 'News',
    logo: 'https://via.placeholder.com/150',
    country: 'US'
  },
  { 
    id: 3, 
    name: 'National Geographic', 
    url: 'http://example.com/stream3',
    category: 'Documentary',
    logo: 'https://via.placeholder.com/150',
    country: 'US'
  }
];

// GET - Get channels with search and filter options
router.get('/', (req, res) => {
  let filteredChannels = [...channels];
  
  // Search by name
  if (req.query.search) {
    const searchTerm = req.query.search.toLowerCase();
    filteredChannels = filteredChannels.filter(channel =>
      channel.name.toLowerCase().includes(searchTerm)
    );
  }
  
  // Filter by category
  if (req.query.category) {
    filteredChannels = filteredChannels.filter(channel =>
      channel.category === req.query.category
    );
  }
  
  // Filter by country
  if (req.query.country) {
    filteredChannels = filteredChannels.filter(channel =>
      channel.country === req.query.country
    );
  }
  
  // Sorting
  if (req.query.sort) {
    switch(req.query.sort) {
      case 'name':
        filteredChannels.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case '-name':
        filteredChannels.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'id':
        filteredChannels.sort((a, b) => a.id - b.id);
        break;
    }
  }
  
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const paginatedChannels = filteredChannels.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    count: paginatedChannels.length,
    total: filteredChannels.length,
    page,
    pages: Math.ceil(filteredChannels.length / limit),
    data: paginatedChannels
  });
});

// GET - Get specific channel by ID
router.get('/:id', (req, res) => {
  const channelId = parseInt(req.params.id);
  const channel = channels.find(ch => ch.id === channelId);
  
  if (!channel) {
    return res.status(404).json({
      success: false,
      error: 'Channel not found'
    });
  }
  
  res.json({
    success: true,
    data: channel
  });
});

// POST - Add new channel (admin only for now)
router.post('/', (req, res) => {
  const { name, url, category, logo, country } = req.body;
  
  // Validate required fields
  if (!name || !url) {
    return res.status(400).json({
      success: false,
      error: 'Name and URL are required fields'
    });
  }
  
  const newChannel = {
    id: channels.length + 1,
    name,
    url,
    category: category || 'General',
    logo: logo || 'https://via.placeholder.com/150',
    country: country || 'IL'
  };
  
  channels.push(newChannel);
  
  res.status(201).json({
    success: true,
    data: newChannel
  });
});

// DELETE - Delete channel
router.delete('/:id', (req, res) => {
  const channelId = parseInt(req.params.id);
  const index = channels.findIndex(ch => ch.id === channelId);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Channel not found'
    });
  }
  
  channels.splice(index, 1);
  
  res.json({
    success: true,
    message: 'Channel deleted successfully'
  });
});

// GET - Get all categories
router.get('/categories/list', (req, res) => {
  const categories = [...new Set(channels.map(ch => ch.category))];
  
  res.json({
    success: true,
    data: categories
  });
});

// GET - Get all countries
router.get('/countries/list', (req, res) => {
  const countries = [...new Set(channels.map(ch => ch.country))];
  
  res.json({
    success: true,
    data: countries
  });
});

// POST - Import channels from M3U playlist
router.post('/import-m3u', (req, res) => {
  const { m3uContent } = req.body;
  
  if (!m3uContent) {
    return res.status(400).json({
      success: false,
      error: 'M3U content is required'
    });
  }
  
  try {
    const parsedChannels = parseM3U(m3uContent);
    
    // Add new channels to the list
    channels = channels.concat(parsedChannels);
    
    res.json({
      success: true,
      message: `Added ${parsedChannels.length} new channels`,
      data: parsedChannels
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Error parsing M3U file'
    });
  }
});

module.exports = router;