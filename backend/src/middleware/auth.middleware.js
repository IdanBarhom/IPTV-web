import {JWT_SECRET} from '../../config/env.js';
import jwt from 'jsonwebtoken';
import IptvConnection from '../models/IptvConnection.model.js';

const authorize = async (req, res, next) => {
    try{
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({message: 'No token provided'});
        }
        const decoded= jwt.verify(token, JWT_SECRET);

        const connection= await IptvConnection.findById(decoded.connectionId).select('+password')   ;
        
        if(!connection){
            return res.status(401).json({message: 'Unauthorized - connection not found'});
        }
        req.connection= connection;
        next();
    }
    catch(error){
        res.status(401).json({
            message: 'Unauthorized',error: error.message});

    }

}

export default authorize;