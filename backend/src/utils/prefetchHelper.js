import { fetchXtreamData } from './fetchXtreamData.js';
import logger from './logger.js';

export const prefetchAllData = async (connection) => {
  logger.info({ connectionId: connection.id }, 'Starting full prefetch');

  try {
    await Promise.all([
      fetchXtreamData(connection, 'get_vod_categories'),
      fetchXtreamData(connection, 'get_series_categories'),
      fetchXtreamData(connection, 'get_live_categories'),
      fetchXtreamData(connection, 'get_vod_streams'),
      fetchXtreamData(connection, 'get_series'),
      fetchXtreamData(connection, 'get_live_streams'),
    ]);

    logger.info({ connectionId: connection.id }, 'Full prefetch completed');
    return true;
  } catch (err) {
    logger.error({ err, connectionId: connection.id }, 'Prefetch failed');
    return false;
  }
};
