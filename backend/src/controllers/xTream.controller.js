import { fetchXtreamData } from '../utils/fetchXtreamData.js';
import { buildVodStreamUrl } from '../utils/buildStreamUrl.js';
import { resolveLiveStream } from '../utils/chooseFormat.js';



/**
 * Returns all VOD (movie) categories for the authenticated connection.
 * @param {import('express').Request} req - req.connection: IptvConnection
 * @param {import('express').Response} res - 200: { success, data: category[] }
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const getMoviesCategories = async (req, res, next) =>
{
    try{
        const data = await fetchXtreamData(req.connection, 'get_vod_categories');

        res.status(200).json({
            success:true,
            data:data
        });
    }
    catch(error){
        next(error);
    }
};

/**
 * Returns all series categories for the authenticated connection.
 * @param {import('express').Request} req - req.connection: IptvConnection
 * @param {import('express').Response} res - 200: { success, data: category[] }
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const getSeriesCategories = async (req, res,next ) =>
{
   try{
        const data = await fetchXtreamData(req.connection, 'get_series_categories');

        res.status(200).json({
            success:true,
            data:data
        });
    }
    catch(error){
        next(error);
    }

};
    
    
/**
 * Returns all live TV categories for the authenticated connection.
 * @param {import('express').Request} req - req.connection: IptvConnection
 * @param {import('express').Response} res - 200: { success, data: category[] }
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const getLiveCategories = async (req, res,next) =>
{
   try{
        const data = await fetchXtreamData(req.connection, 'get_live_categories');

        res.status(200).json({
            success:true,
            data:data
        });
    }
    catch(error){
        next(error);
    }

};


/////////////////////////////////////////////////////////////////////////////////////

/**
 * Returns all movies (VOD streams) belonging to a specific category.
 * @param {import('express').Request} req - req.connection: IptvConnection, req.params.categoryId: string
 * @param {import('express').Response} res - 200: { success, data: stream[] }
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const getMoviesByCategories = async (req, res,next) =>
{
   try{
        const { categoryId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
        const allData = await fetchXtreamData(
          req.connection,
          'get_vod_streams',
          { category_id: categoryId }
        );
        const total = Array.isArray(allData) ? allData.length : 0;
        const data = Array.isArray(allData) ? allData.slice((page - 1) * limit, page * limit) : allData;

        res.status(200).json({
            success:true,
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    }
    catch(error){
        next(error);
    }

};
/**
 * Returns all series belonging to a specific category.
 * @param {import('express').Request} req - req.connection: IptvConnection, req.params.categoryId: string
 * @param {import('express').Response} res - 200: { success, data: series[] }
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const getSeriesByCategories = async (req, res,next) =>
{
  try{
        const { categoryId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
        const allData = await fetchXtreamData(
          req.connection,
          'get_series',
          { category_id: categoryId }
        );
        const total = Array.isArray(allData) ? allData.length : 0;
        const data = Array.isArray(allData) ? allData.slice((page - 1) * limit, page * limit) : allData;

        res.status(200).json({
            success:true,
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    }
    catch(error){
        next(error);
    }

};


/**
 * Returns all live channels belonging to a specific category.
 * @param {import('express').Request} req - req.connection: IptvConnection, req.params.categoryId: string
 * @param {import('express').Response} res - 200: { success, data: channel[] }
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const getLiveByCategories = async (req, res,next) =>
{
   try{
        const { categoryId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
        const allData = await fetchXtreamData(
          req.connection,
          'get_live_streams',
          { category_id: categoryId }
        );
        const total = Array.isArray(allData) ? allData.length : 0;
        const data = Array.isArray(allData) ? allData.slice((page - 1) * limit, page * limit) : allData;

        res.status(200).json({
            success:true,
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    }
    catch(error){
        next(error);
    }

};


////////////////////////////////////////////////////////////////////////////
/**
 * Resolves a working live stream URL by probing supported formats for the given stream ID.
 * @param {import('express').Request} req - req.connection: IptvConnection, req.params.streamId: string
 * @param {import('express').Response} res - 200: { success, streamUrl: { success, format, url } }
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const getLiveStream = async (req, res,next) =>
{
  try {
    const { streamId } = req.params;

    const streamUrl = await resolveLiveStream(req.connection, streamId, "web");

    res.status(200).json({
      success: true,
      streamUrl,
    });
  } catch (err) {
    next(err);
  }

};

/**
 * Builds and returns a direct VOD stream URL for a movie.
 * @param {import('express').Request} req - req.connection: IptvConnection, req.params.streamId: string, req.query.ext: string (container format e.g. "mp4")
 * @param {import('express').Response} res - 200: { success, streamUrl: string }
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const getMovieStream = async (req, res,next) =>
{
  try {
    const {streamId} = req.params;
    const{ext}= req.query;

    const streamUrl = buildVodStreamUrl(req.connection, streamId,"movie",ext);


    res.status(200).json({
      success: true,
      streamUrl,
    });
  } catch (err) {
    next(err);
  }

};

/**
 * Builds and returns a direct stream URL for a series episode.
 * @param {import('express').Request} req - req.connection: IptvConnection, req.params.streamId: string, req.query.ext: string (container format e.g. "mp4")
 * @param {import('express').Response} res - 200: { success, streamUrl: string }
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const getSeriesStream = async (req, res,next) =>
{
  try {
    const { streamId } = req.params;
    const{ext}= req.query;

    const streamUrl = buildVodStreamUrl(req.connection, streamId,"series",ext);

    res.status(200).json({
      success: true,
      streamUrl,
    });
  } catch (err) {
    next(err);
  }

};

/**
 * Returns full metadata for a single movie (plot, poster, cast, etc.).
 * @param {import('express').Request} req - req.connection: IptvConnection, req.params.streamId: string
 * @param {import('express').Response} res - 200: { success, data: vodInfo }
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const getMovieInfo = async (req, res,next) =>
{
  try {
    const { streamId } = req.params;
    const data = await fetchXtreamData(
      req.connection,
      'get_vod_info',        // action ל-VOD ב-Xtream
      { vod_id: streamId } // פרמטר נוסף
    );
    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (err) {
    next(err);
  }   
};

/**
 * Returns full metadata for a series including all seasons and episodes.
 * @param {import('express').Request} req - req.connection: IptvConnection, req.params.streamId: string
 * @param {import('express').Response} res - 200: { success, data: seriesInfo }
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const getSeriesInfo = async (req, res,next) =>
{
  try {
    const { streamId } = req.params;
    const data = await fetchXtreamData(
      req.connection,
      'get_series_info',        // action ל-VOD ב-Xtream
      { series_id: streamId } // פרמטר נוסף
    );
    res.status(200).json({
      success: true,
      data: data,
    });
  }
    catch (err) {
    next(err);
  }
};

/**
 * Returns the next few upcoming shows (short EPG) for a live channel.
 * Available to all tiers. Cached 1h (inherits fetchXtreamData default).
 */
export const getShortEpg = async (req, res, next) => {
  try {
    const { streamId } = req.params;
    const data = await fetchXtreamData(req.connection, 'get_short_epg', { stream_id: streamId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * Returns the full 7-day EPG for a live channel. Premium only.
 * Cached 1h (inherits fetchXtreamData default).
 */
export const getFullEpg = async (req, res, next) => {
  try {
    const { streamId } = req.params;
    const data = await fetchXtreamData(req.connection, 'get_epg', { stream_id: streamId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

