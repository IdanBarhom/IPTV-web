import IptvConnection from "../models/iptvConnection.model.js";

export const getConnections = async (req, res,next) => 
{
    try 
    {
        const connections= await IptvConnection.find();
        res.status(200).json({ 
            success:true,
            data:connections
        });
    } 
    catch (error) 
    {
        next(error);
    }
};

export const getConnection= async (req, res,next) => 
{
    try
    {
        const connection= await IptvConnection.findById(req.params.id).select('-rawUserInfo -rawServerInfo');
        if(!connection){
            const error= new Error('Connection not found');
            error.status=404;
            throw error;
        }
        res.status(200).json({
            success:true,
            data:connection
        });
    }
    catch (error)
    {
        next(error);
    }
}