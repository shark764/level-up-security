const redis = require('../utils/redis');
const {error} = require('../utils/response');
const jwt = require('jsonwebtoken');
const logger = require('../logging/logger');
const validateAccessToken = async(req, res, next) => {
    
    
    const {accessToken, user_id} = req;
    let parsedUserId;
    if(!user_id) {
        try{
            const {data} = await jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
            parsedUserId = data;
        }catch(jwtError) {
            return res.statusCode(500).json(error({requestId: req.id, code: 500, message: jwtError.message}));
        }
    }
    const key = `{${user_id || parsedUserId}}{SESSION}{${accessToken}}`;
    redis.getKey(key, (err, value) => {
        // this goes more into our side
        if(err) {
            logger.error(err);
            return res.status(500).json(error({requestId: req.id, code: 500, message: err.message }));
        }
        if (!value) {
            return res
            .status(403)
            .json(error({requestId: req.id, code: 403}));
        }
        req.authToken = value;
        req.key = key;
        req.user_id = user_id || parsedUserId;
        next();           
    });
};

module.exports =  validateAccessToken;