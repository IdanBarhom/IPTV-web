import axios from 'axios';
import cacheService from '../services/cacheService.js';
import logger from './logger.js';

const getCacheKey = (connection, action, extraParams = {}) => {
  const paramsStr = Object.keys(extraParams).length > 0
    ? JSON.stringify(extraParams)
    : '';
  return `xtream:${connection.id}:${action}:${paramsStr}`;
};

const prefetchInProgress = new Set();

const fetchSingleAction = async (connection, action, extraParams = {}) => {
  const { baseUrl, username, password } = connection;

  const params = new URLSearchParams({
    username,
    password,
    action,
    ...extraParams,
  });

  const url = `${baseUrl}/player_api.php?${params.toString()}`;

  const timeout = action.includes('streams') || action.includes('series')
    ? 30000
    : 10000;

  const response = await axios.get(url, { timeout });
  const data = response.data;

  const cacheKey = getCacheKey(connection, action, extraParams);
  await cacheService.set(cacheKey, data, 3600);
  logger.debug({ action }, 'Xtream data fetched and cached');

  return data;
};

const backgroundPrefetch = async (connection) => {
  const userKey = `${connection.baseUrl}:${connection.username}`;

  if (prefetchInProgress.has(userKey)) {
    logger.debug({ userKey }, 'Prefetch already in progress, skipping');
    return;
  }

  prefetchInProgress.add(userKey);
  logger.info({ connectionId: connection.id }, 'Background re-prefetch started');

  const actions = [
    'get_vod_categories',
    'get_series_categories',
    'get_live_categories',
    'get_vod_streams',
    'get_series',
    'get_live_streams',
  ];

  try {
    for (const action of actions) {
      const key = getCacheKey(connection, action);
      if (!(await cacheService.has(key))) {
        logger.debug({ action }, 'Prefetching action');
        await fetchSingleAction(connection, action);
      } else {
        logger.debug({ action }, 'Skipping action (already cached)');
      }
    }
    logger.info({ connectionId: connection.id }, 'Background prefetch completed');
  } catch (err) {
    logger.error({ err, connectionId: connection.id }, 'Background prefetch error');
  } finally {
    prefetchInProgress.delete(userKey);
  }
};

const shouldReprefetch = async (connection) => {
  const mainActions = [
    'get_vod_categories',
    'get_series_categories',
    'get_live_categories',
  ];

  for (const action of mainActions) {
    const key = getCacheKey(connection, action);
    if (!(await cacheService.has(key))) {
      return true;
    }
  }

  return false;
};

export const fetchXtreamData = async (connection, action, extraParams = {}) => {
  const cacheKey = getCacheKey(connection, action, extraParams);
  const cachedData = await cacheService.get(cacheKey);

  if (cachedData) {
    logger.debug({ action }, 'Cache HIT');
    return cachedData;
  }

  logger.debug({ action }, 'Cache MISS');

  if (await shouldReprefetch(connection)) {
    const userKey = `${connection.baseUrl}:${connection.username}`;
    if (!prefetchInProgress.has(userKey)) {
      logger.info({ connectionId: connection.id }, 'Cache expired, triggering background re-prefetch');
      backgroundPrefetch(connection); // intentionally not awaited
    }
  }

  try {
    return await fetchSingleAction(connection, action, extraParams);
  } catch (error) {
    if (error.response) {
      throw {
        status: error.response.status,
        message: 'XTREAM_SERVER_ERROR',
        data: error.response.data,
      };
    }

    throw {
      status: 500,
      message: 'XTREAM_CONNECTION_FAILED',
      data: error.message,
    };
  }
};
