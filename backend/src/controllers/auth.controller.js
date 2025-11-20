import mongoose from 'mongoose';
import axios from 'axios';
import bcrypt from 'bcryptjs';

import IptvConnection from '../models/IptvConnection.model.js';
import jwt from 'jsonwebtoken';
const JWT_SECRET= process.env.JWT_SECRET
const JWT_EXPIRE= process.env.JWT_EXPIRE || '7d';


const buildApiUrl = (url, username, password) => {
    return `${url}/player_api.php?username=${username}&password=${password}`;
}

const normalizeBaseUrl=(url) => {
    const trimmed= url.trim().replace(/\/+$/,'');
    if(!trimmed.startsWith('http')){
        return `http://${trimmed}`;
    }
    return trimmed;
};

//CONNECT CONTROLLER
export const connect = async (req, res,next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {name, username, password, url} = req.body;

        if(!name || !username || !password || !url){
            return res.status(400).json({
                success:false ,
                error:'Please provide name, url, username and password'
            });
        }
        const baseUrl = normalizeBaseUrl(url);
        const apiUrl = buildApiUrl(baseUrl, username, password);

        // Test connection to IPTV provider
        let data;   
        try {
            const response= await axios.get(apiUrl, {timeout:8000});
            data=response.data;
        } catch (error) {
            return res.status(401).json({
                success:false,
                error:'Unable to connect to IPTV provider. Please check the URL.'
            });
        }
        const userInfo=data?.user_info;
        const serverInfo= data?.server_info;


        if(!userInfo|| userInfo.status !=='Active'){
            await session.abortTransaction();
            session.endSession();
            return res.status(401).json({
                success:false,
                error:'Invalid IPTV credentials or inactive account' 
            });
        }
        const expiresAt=userInfo.exp_date ? new Date(parseInt(userInfo.exp_date,10 )*1000) : null;


        const connection = await IptvConnection.create([{
            baseUrl,
          username,
          password,
          apiUrl,
          status: userInfo.status,
          auth: userInfo.auth,
          message: userInfo.message || '',
          expDateRaw: userInfo.exp_date,
          expiresAt,
          isTrial: userInfo.is_trial === '1',
          activeCons: Number(userInfo.active_cons || 0),
          maxConnections: Number(userInfo.max_connections || 1),
          allowedOutputFormats: userInfo.allowed_output_formats || [],
          createdAtRaw: userInfo.created_at,
          serverUrl: serverInfo?.url,
          serverPort: serverInfo?.port,
          httpsPort: serverInfo?.https_port,
          serverProtocol: serverInfo?.server_protocol,
          rtmpPort: serverInfo?.rtmp_port,
          timezone: serverInfo?.timezone,
          serverTimestampNow: serverInfo?.timestamp_now,
          serverTimeNow: serverInfo?.time_now,
          process: serverInfo?.process,
          rawUserInfo: userInfo,
          rawServerInfo: serverInfo,
        },
      ], { session }
    );

    const token = jwt.sign({userId: connection[0]._id}, JWT_SECRET, {expiresIn: JWT_EXPIRE});

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({
        success:true,
        token,
        connection: connection[0],
    });

    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }

};




//DISCONNECT CONTROLLER
export const disconnect = async (req, res) => 
{


};