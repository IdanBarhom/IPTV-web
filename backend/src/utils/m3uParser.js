// Function to parse M3U playlists
function parseM3U(m3uContent) {
  const lines = m3uContent.split('\n');
  const channels = [];
  let currentChannel = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Channel info line
    if (line.startsWith('#EXTINF:')) {
      // Extract info from line
      const match = line.match(/#EXTINF:(-?\d+)\s*(.*)?,\s*(.*)/);
      if (match) {
        const attributes = match[2] || '';
        const name = match[3] || 'Unknown Channel';
        
        // Extract additional attributes
        const logoMatch = attributes.match(/tvg-logo="([^"]*)"/);
        const groupMatch = attributes.match(/group-title="([^"]*)"/);
        const countryMatch = attributes.match(/tvg-country="([^"]*)"/);
        
        currentChannel = {
          name: name,
          logo: logoMatch ? logoMatch[1] : '',
          category: groupMatch ? groupMatch[1] : 'General',
          country: countryMatch ? countryMatch[1] : 'Unknown'
        };
      }
    }
    // URL line
    else if (line && !line.startsWith('#') && currentChannel.name) {
      currentChannel.url = line;
      currentChannel.id = Date.now() + Math.random(); // Temporary ID
      channels.push(currentChannel);
      currentChannel = {};
    }
  }
  
  return channels;
}

// Function to load M3U from URL
async function loadM3UFromURL(url) {
  try {
    // Will add actual URL fetching later
    // For now return example
    return {
      success: false,
      error: 'Loading from URL not yet implemented'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  parseM3U,
  loadM3UFromURL
};