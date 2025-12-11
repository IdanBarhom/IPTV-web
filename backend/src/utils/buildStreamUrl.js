

export const buildLiveStreamUrl = (connection, streamId, extension = 'm3u8') => {
  const { baseUrl, username, password, allowedOutputFormats } = connection;

  return `${baseUrl}/live/${username}/${password}/${streamId}.${extension}`;
};

export const buildVodStreamUrl = (connection, streamId,type, extension) => {
  const { baseUrl, username, password } = connection;
  console.log(streamId)
  console.log(extension)
  // if (extension=== "mkv")
  //   return `${baseUrl}/${type}/${username}/${password}/${streamId}.m3u8`;

    return `${baseUrl}/${type}/${username}/${password}/${streamId}.${extension}`;

  
};