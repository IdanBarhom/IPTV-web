const ALLOWED_EXTENSIONS = ['m3u8', 'ts', 'mp4', 'mkv', 'avi'];

/**
 * Builds a direct live stream URL using the Xtream Codes URL pattern.
 * @param {object} connection - IptvConnection document (needs baseUrl, username, password).
 * @param {string} streamId - The live stream ID.
 * @param {string} [extension='m3u8'] - Container format extension.
 * @returns {string} Full live stream URL.
 */
export const buildLiveStreamUrl = (connection, streamId, extension = 'm3u8') => {
  const { baseUrl, username, password } = connection;
  const safeExt = ALLOWED_EXTENSIONS.includes(extension) ? extension : 'm3u8';
  return `${baseUrl}/live/${username}/${password}/${streamId}.${safeExt}`;
};

/**
 * Builds a direct VOD or series stream URL using the Xtream Codes URL pattern.
 * @param {object} connection - IptvConnection document (needs baseUrl, username, password).
 * @param {string} streamId - The VOD or series episode stream ID.
 * @param {string} type - Path segment: "movie" or "series".
 * @param {string} extension - Container format extension (e.g. "mp4", "mkv").
 * @returns {string} Full stream URL.
 */
export const buildVodStreamUrl = (connection, streamId, type, extension) => {
  const { baseUrl, username, password } = connection;
  const safeExt = ALLOWED_EXTENSIONS.includes(extension) ? extension : 'mp4';
  return `${baseUrl}/${type}/${username}/${password}/${streamId}.${safeExt}`;
};