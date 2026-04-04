import logger from '../utils/logger.js';

/**
 * Centralized Express error handler. Normalizes Mongoose errors (CastError, duplicate key,
 * ValidationError) and returns a JSON error response.
 * @param {Error} err - The error object passed via next(err)
 * @param {import('express').Request} req
 * @param {import('express').Response} res - JSON: { success: false, message: string }
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const errorMiddleware = (err, req, res, next) => {
  try
    {
    let error={...err};
    error.message = err.message;
    logger.error({ err, reqId: req.id }, 'Unhandled error');

    if(err.name== 'CastError'){
        const message = 'Resource not found';
        error= new Error(message);
        error.statusCode=404;
    };
    if(err.code===11000){
        const message = 'Duplicate field value entered';
        error= new Error(message);
        error.statusCode=400;
    };
    if(err.name==='ValidationError'){
        const message = Object.values(err.errors).map(value=>value.message).join(', ');
        error= new Error(message);
        error.statusCode=400;
    };
    res.status(error.statusCode || 500).json({success: false, message: error.message || 'Server Error'});
    }
   catch (error) {
    next(error)
  }
};


export default errorMiddleware;
