import axios from 'axios';
import IptvConnection from '../models/IptvConnection.model.js';
import { fetchXtreamData} from '../utils/fetchXtreamData.js';
import { buildLiveStreamUrl, buildVodStreamUrl } from '../utils/buildStreamUrl.js';
import {resolveLiveStream} from '../utils/chooseFormat.js';



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
        console.error('Error fetching movie categories:', error.message);
        next(error);
    }
};

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
        console.error('Error fetching series categories:', error.message);
        next(error);
    }

};
    
    
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
        console.error('Error fetching live categories:', error.message);
        next(error);
    }

};


/////////////////////////////////////////////////////////////////////////////////////

export const getMoviesByCategories = async (req, res,next) => 
{
   try{
        const { categoryId } = req.params;
       const data = await fetchXtreamData(
      req.connection,
      'get_vod_streams',        // action ל-VOD ב-Xtream
      { category_id: categoryId } // פרמטר נוסף
    );

        res.status(200).json({
            success:true,
            data:data
        });
    }
    catch(error){
        console.error('Error fetching live categories:', error.message);
        next(error);
    }

};
export const getSeriesByCategories = async (req, res,next) => 
{
  try{
        const { categoryId } = req.params;
       const data = await fetchXtreamData(
      req.connection,
      'get_series_streams',        // action ל-VOD ב-Xtream
      { category_id: categoryId } // פרמטר נוסף
    );

        res.status(200).json({
            success:true,
            data:data
        });
    }
    catch(error){
        console.error('Error fetching live categories:', error.message);
        next(error);
    }

};


export const getLiveByCategories = async (req, res,next) => 
{
   try{
        const { categoryId } = req.params;
       const data = await fetchXtreamData(
      req.connection,
      'get_live_streams',        // action ל-VOD ב-Xtream
      { category_id: categoryId } // פרמטר נוסף
    );

        res.status(200).json({
            success:true,
            data:data
        });
    }
    catch(error){
        console.error('Error fetching live categories:', error.message);
        next(error);
    }

};


////////////////////////////////////////////////////////////////////////////
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

export const getMovieStream = async (req, res,next) => 
{
  try {
    const { streamId } = req.params;

    const streamUrl = buildVodStreamUrl(req.connection, streamId);

    res.status(200).json({
      success: true,
      streamUrl,
    });
  } catch (err) {
    next(err);
  }

};

export const getSeriesStream = async (req, res,next) => 
{
  try {
    const { streamId } = req.params;

    const streamUrl = buildVodStreamUrl(req.connection, streamId);

    res.status(200).json({
      success: true,
      streamUrl,
    });
  } catch (err) {
    next(err);
  }

};



