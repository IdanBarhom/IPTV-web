import { Router } from "express";
const xTreamRouter=  Router();
import authorize from "../middleware/auth.middleware.js";
import { 
    getMoviesCategories, getSeriesCategories, getLiveCategories,
    getMoviesByCategories, getSeriesByCategories, getLiveByCategories, 
    getLiveStream, getMovieStream, getSeriesStream} 
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

xTreamRouter.get('/movies/video/:streamId', authorize, getMovieStream);

xTreamRouter.get('/series/video/:streamId', authorize, getSeriesStream);


export default xTreamRouter;