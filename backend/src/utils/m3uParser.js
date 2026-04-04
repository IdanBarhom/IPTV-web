import axios from 'axios';

/**
 * Parses a raw M3U playlist string into an array of channel objects.
 * Extracts name, logo (tvg-logo), category (group-title), country (tvg-country), and stream URL.
 * @param {string} m3uContent - Full M3U file content as a string.
 * @returns {{ name: string, logo: string, category: string, country: string, url: string, id: number }[]}
 */
export function parseM3U(m3uContent) {
  const lines = m3uContent.split('\n');
  const channels = [];
  let currentChannel = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      const match = line.match(/#EXTINF:(-?\d+)\s*(.*)?,\s*(.*)/);
      if (match) {
        const attributes = match[2] || '';
        const name = match[3] || 'Unknown Channel';

        const logoMatch = attributes.match(/tvg-logo="([^"]*)"/);
        const groupMatch = attributes.match(/group-title="([^"]*)"/);
        const countryMatch = attributes.match(/tvg-country="([^"]*)"/);

        currentChannel = {
          name,
          logo: logoMatch ? logoMatch[1] : '',
          category: groupMatch ? groupMatch[1] : 'General',
          country: countryMatch ? countryMatch[1] : 'Unknown'
        };
      }
    } else if (line && !line.startsWith('#') && currentChannel.name) {
      currentChannel.url = line;
      currentChannel.id = Date.now() + Math.random();
      channels.push(currentChannel);
      currentChannel = {};
    }
  }

  return channels;
}

/**
 * Fetches an M3U playlist from a remote URL and parses it into channel objects.
 * @param {string} url - The remote URL of the M3U playlist.
 * @returns {Promise<{ success: true, channels: object[] } | { success: false, error: string }>}
 */
export async function loadM3UFromURL(url) {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      responseType: 'text',
    });
    const channels = parseM3U(response.data);
    return { success: true, channels };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
