import aj from '../../config/arcjet.js';

const arcjetMiddleware = async (req, res, next) => {
    try{
        const decision = await aj.protect(req,{ requested: 1});
        if (decision.isDenied()) {
            if(decision.reason.isRateLimit()) return res.status(429).json({message: 'Too Many Requests'});
            if(decision.reason.isBot()) return res.status(403).json({message: 'Access Denied - Bot Detected'});
            
            
            return res.status(403).json({message: 'Access Denied'});
        }
        next();
    } 
    catch(err){
        console.log(`Arcjet Middleware Error: ${err}`)
    }

}
export default arcjetMiddleware;