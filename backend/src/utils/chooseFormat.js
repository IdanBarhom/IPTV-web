import axios from "axios";

/**
 * Auto-detect the working URL for a LIVE IPTV stream.
 * Tries formats based on allowedOutputFormats, then tries fallback extensions.
 */
export const resolveLiveStream = async (connection, streamId, clientType = "web") => {
  const {
    serverProtocol,
    serverUrl,
    serverPort,
    username,
    password,
    allowedOutputFormats,
    rtmpPort
  } = connection;

  // Base URLs
  const httpBase = `${serverProtocol}://${serverUrl}:${serverPort}`;
  const rtmpBase = `rtmp://${serverUrl}:${rtmpPort}`;

  // Preferred formats based on client type
  const priorityForWeb = ["m3u8", "ts", "rtmp"];
  const priorityForNative = ["ts", "m3u8", "rtmp"];

  const order = clientType === "native" ? priorityForNative : priorityForWeb;

  // Filter only the allowed formats from the server + in preferred order
  const formatsToTry = order.filter((fmt) => allowedOutputFormats.includes(fmt));

  // Add fallback formats if allowed list fails
  const fallbackExtensions = ["m3u8", "ts", "mp4", "mkv", ""];
  fallbackExtensions.forEach(ext => {
    if (!formatsToTry.includes(ext)) formatsToTry.push(ext);
  });

  console.log("🔍 Trying formats:", formatsToTry);

  // Try each format until one works
  for (const format of formatsToTry) {
    let url = "";

    if (format === "rtmp") {
      url = `${rtmpBase}/live/${username}/${password}/${streamId}`;
    } else if (format === "") {
      url = `${httpBase}/live/${username}/${password}/${streamId}`;
    } else {
      url = `${httpBase}/live/${username}/${password}/${streamId}.${format}`;
    }

    console.log(`⏳ Testing: ${url}`);

    try {
      // HEAD is faster but not all IPTV servers support it → so we use GET
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          "User-Agent": "Dalvik/2.1.0 (Linux; Android 11)" // bypasses many IPTV blocks
        },
        validateStatus: () => true // allow non-200 in axios, we handle manually
      });

      if (response.status === 200) {
        console.log(`✅ WORKING STREAM FOUND: ${url}`);
        return { success: true, format, url };
      }
    } catch (err) {
      // ignore and continue
    }
  }

  // If none worked:
  return {
    success: false,
    message: "No working stream URL found",
    tried: formatsToTry
  };
};