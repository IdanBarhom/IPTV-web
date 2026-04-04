import axios from "axios";
import logger from "./logger.js";

/**
 * Probes multiple stream formats to find one the server actually serves (HTTP 200).
 * Priority order for web: m3u8 → ts → rtmp → mp4 → mkv → (no ext).
 * First intersects with connection.allowedOutputFormats, then appends fallbacks.
 * @param {object} connection - IptvConnection document (needs serverProtocol, serverUrl, serverPort, username, password, allowedOutputFormats, rtmpPort).
 * @param {string} streamId - The live stream ID.
 * @param {string} [clientType="web"] - "web" or "native" (changes format priority order).
 * @returns {Promise<{ success: true, format: string, url: string } | { success: false, message: string, tried: string[] }>}
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

  logger.debug({ streamId, formats: formatsToTry }, 'Probing stream formats');

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

    logger.debug({ streamId, format }, 'Testing stream format');

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
        logger.info({ streamId, format }, 'Working stream format found');
        return { success: true, format, url };
      }
    } catch (err) {
      // ignore and continue
    }
  }

  // If none worked:
  logger.warn({ streamId, tried: formatsToTry }, 'No working stream format found');
  return {
    success: false,
    message: "No working stream URL found",
    tried: formatsToTry
  };
};
