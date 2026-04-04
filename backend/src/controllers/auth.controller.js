import crypto from 'crypto';
import axios from 'axios';
import jwt from 'jsonwebtoken';

import prisma from '../database/prisma.js';
import { prefetchAllData } from '../utils/prefetchHelper.js';
import { encrypt } from '../utils/encryption.js';
import { loadM3UFromURL } from '../utils/m3uParser.js';
import cacheService from '../services/cacheService.js';
import logger from '../utils/logger.js';

const JWT_SECRET         = process.env.JWT_SECRET;
const JWT_ACCESS_EXPIRE  = process.env.JWT_ACCESS_EXPIRE  || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

const buildApiUrl = (url, username, password) =>
  `${url}/player_api.php?username=${username}&password=${password}`;

const normalizeBaseUrl = (url) => {
  const trimmed = url.trim().replace(/\/+$/, '');
  return trimmed.startsWith('http') ? trimmed : `http://${trimmed}`;
};

const issueTokens = async (connectionId) => {
  const token = jwt.sign(
    { connectionId, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRE }
  );
  const refreshTokenValue = jwt.sign(
    { connectionId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRE }
  );
  const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
  await prisma.iptvConnection.update({
    where: { id: connectionId },
    data:  { refreshToken: refreshTokenHash },
  });
  return { token, refreshToken: refreshTokenValue };
};

const connectXtream = async (req, res) => {
  const { username, password, url } = req.body;

  const baseUrl = normalizeBaseUrl(url);
  const apiUrl  = buildApiUrl(baseUrl, username, password);

  let data;
  try {
    const response = await axios.get(apiUrl, { timeout: 8000 });
    data = response.data;
  } catch {
    return res.status(401).json({
      success: false,
      error: 'Unable to connect to IPTV provider. Please check the URL.',
    });
  }

  const userInfo   = data?.user_info;
  const serverInfo = data?.server_info;

  if (!userInfo || userInfo.status !== 'Active') {
    return res.status(401).json({
      success: false,
      error: 'Invalid IPTV credentials or inactive account',
    });
  }

  const expiresAt = userInfo.exp_date
    ? new Date(parseInt(userInfo.exp_date, 10) * 1000)
    : null;

  const connection = await prisma.iptvConnection.create({
    data: {
      type: 'xtream',
      baseUrl,
      username,
      password: encrypt(password),
      apiUrl,
      status:              userInfo.status,
      auth:                userInfo.auth != null ? parseInt(userInfo.auth) : null,
      message:             userInfo.message || '',
      expDateRaw:          userInfo.exp_date,
      expiresAt,
      isTrial:             userInfo.is_trial === '1',
      activeCons:          Number(userInfo.active_cons   || 0),
      maxConnections:      Number(userInfo.max_connections || 1),
      allowedOutputFormats: userInfo.allowed_output_formats || [],
      createdAtRaw:        userInfo.created_at,
      serverUrl:           serverInfo?.url,
      serverPort:          serverInfo?.port,
      httpsPort:           serverInfo?.https_port,
      serverProtocol:      serverInfo?.server_protocol,
      rtmpPort:            serverInfo?.rtmp_port,
      timezone:            serverInfo?.timezone,
      serverTimestampNow:  serverInfo?.timestamp_now ? parseInt(serverInfo.timestamp_now) : null,
      serverTimeNow:       serverInfo?.time_now,
      process:             serverInfo?.process,
      rawUserInfo:         userInfo,
      rawServerInfo:       serverInfo,
    },
  });

  const { token, refreshToken } = await issueTokens(connection.id);

  prefetchAllData(connection).catch(err =>
    logger.error({ err }, 'Initial prefetch failed')
  );

  return { connection, token, refreshToken };
};

const connectM3U = async (req, res) => {
  const { m3uUrl } = req.body;

  const result = await loadM3UFromURL(m3uUrl);
  if (!result.success) {
    return res.status(401).json({
      success: false,
      error: `Unable to fetch M3U playlist: ${result.error}`,
    });
  }

  const connection = await prisma.iptvConnection.create({
    data: {
      type:   'm3u',
      m3uUrl,
      status: 'Active',
    },
  });

  // Cache parsed channels immediately (TTL 1h)
  const cacheKey = `m3u:${connection.id}:channels`;
  await cacheService.set(cacheKey, result.channels, 3600);

  const { token, refreshToken } = await issueTokens(connection.id);

  return { connection, token, refreshToken, channelCount: result.channels.length };
};

export const connect = async (req, res, next) => {
  try {
    const { type } = req.body;

    if (type === 'm3u') {
      const outcome = await connectM3U(req, res);
      if (!outcome) return; // response already sent (error case)
      return res.status(201).json({ success: true, ...outcome });
    }

    // Default: xtream
    const outcome = await connectXtream(req, res);
    if (!outcome) return; // response already sent (error case)
    return res.status(201).json({ success: true, ...outcome });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, error: 'Invalid token type' });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const connection = await prisma.iptvConnection.findFirst({
      where: { id: decoded.connectionId, refreshToken: tokenHash },
    });

    if (!connection) {
      return res.status(401).json({ success: false, error: 'Refresh token not found or revoked' });
    }

    const token = jwt.sign(
      { connectionId: connection.id, type: 'access' },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRE }
    );

    res.status(200).json({ success: true, token });
  } catch (error) {
    next(error);
  }
};

export const disconnect = async (req, res, next) => {
  try {
    const connectionId = req.connection.id;
    await prisma.iptvConnection.delete({ where: { id: connectionId } });
    await cacheService.clearUserCache(String(connectionId));
    res.status(200).json({ success: true, message: 'Disconnected successfully' });
  } catch (error) {
    next(error);
  }
};
