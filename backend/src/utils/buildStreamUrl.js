

export const buildLiveStreamUrl = (connection, streamId, extension = 'm3u8') => {
  const { baseUrl, username, password } = connection;

  // דוגמה לפורמט הנפוץ ב-Xtream
  return `${baseUrl}/live/${username}/${password}/${streamId}.${extension}`;
};

export const buildVodStreamUrl = (connection, streamId, extension = 'mkv') => {
  const { baseUrl, username, password } = connection;

  return `${baseUrl}/movie/${username}/${password}/${streamId}.${extension}`;
};