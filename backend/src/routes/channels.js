const express = require('express');  // server
const router = express.Router();

//using dummy data for channels
let channels= [
    { 
    id: 1, 
    name: 'ערוץ 12', 
    url: 'http://example.com/stream1',
    category: 'ישראלי',
    logo: 'https://via.placeholder.com/150',
    country: 'IL'
  },
  { 
    id: 2, 
    name: 'CNN', 
    url: 'http://example.com/stream2',
    category: 'חדשות',
    logo: 'https://via.placeholder.com/150',
    country: 'US'
  },
  { 
    id: 3, 
    name: 'National Geographic', 
    url: 'http://example.com/stream3',
    category: 'תיעודי',
    logo: 'https://via.placeholder.com/150',
    country: 'US'
  }
];

//get all channels
router.get('/', (req, res) => {
    res.json({
        success: true,
        count: channels.length,
        data: channels
    });
});

// get id for specific channel
router.get('/:id', (req, res) => {
    const channelId = parseInt(req.params.id);
    const channel = channels.find(c => c.id === channelId);
    if(!channel) {
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

// Post new channel (only for admins - not implemented yet)
router.post('/', (req, res) => {
    const { name, url, category, logo, country } = req.body;

    if(!name || !url) {
        return res.status(400).json({
            success: false,
            error: 'Name and URL are required'
        });
    }

    const newChannel = {
        id: channels.length + 1,
        name,
        url,
        category: category || 'general',
        logo: logo || 'https://via.placeholder.com/150',
        country: country || 'unknown'
    };
    channels.push(newChannel);
    res.status(201).json({
        success: true,
        data: newChannel
    });
});
router.delete('/:id', (req, res) => {
  const channelId = parseInt(req.params.id);
  const index = channels.findIndex(ch => ch.id === channelId);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'ערוץ לא נמצא'
    });
  }
  
  channels.splice(index, 1);
  
  res.json({
    success: true,
    message: 'הערוץ נמחק בהצלחה'
  });
});



module.exports = router;
