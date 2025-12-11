import { Router } from "express";
const xTreamRouter=  Router();
import authorize from "../middleware/auth.middleware.js";
import { 
    getMoviesCategories, getSeriesCategories, getLiveCategories,
    getMoviesByCategories, getSeriesByCategories, getLiveByCategories, 
    getLiveStream, getMovieStream, getSeriesStream , getMovieInfo, getSeriesInfo} 
    from "../controllers/xTream.controller.js";

//all categories routes
xTreamRouter.get('/movies/categories',authorize, getMoviesCategories);

xTreamRouter.get('/series/categories', authorize, getSeriesCategories);

xTreamRouter.get('/live/categories', authorize,  getLiveCategories);


// //fetching by category routes
xTreamRouter.get('/movies/categories/:categoryId',authorize, getMoviesByCategories);

xTreamRouter.get('/series/categories/:categoryId',authorize, getSeriesByCategories);

xTreamRouter.get('/live/categories/:categoryId',authorize, getLiveByCategories);
 

//fetching video stream by category route
xTreamRouter.get('/live/video/:streamId', authorize, getLiveStream);

xTreamRouter.get('/movie/video/:streamId', authorize, getMovieStream);

xTreamRouter.get('/series/video/:streamId', authorize, getSeriesStream);


    
// fetching video info by streamId
xTreamRouter.get('/movie/info/:streamId', authorize, getMovieInfo);

xTreamRouter.get('/series/info/:streamId', authorize, getSeriesInfo);


export default xTreamRouter;