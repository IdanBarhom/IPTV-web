

export const buildLiveStreamUrl = (connection, streamId, extension = 'm3u8') => {
  const { baseUrl, username, password, allowedOutputFormats } = connection;

  return `${baseUrl}/live/${username}/${password}/${streamId}.${extension}`;
};

export const buildVodStreamUrl = (connection, streamId, extension = 'mkv') => {
  const { baseUrl, username, password } = connection;

  return `${baseUrl}/movie/${username}/${password}/${streamId}.${extension}`;
};