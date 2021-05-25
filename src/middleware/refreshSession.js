const redis = require('../utils/redis');
const {error} = require('../utils/response');
const User = require('../db/models/user');
const {generateTokens}= require('../utils/auth');
const logger = require('../logging/logger');
const refreshSession = (req, res, next)=>{
    const {key, user_id} = req;
    redis.removeKey(key, (err, response)=>{
        if(err) {
            logger.error(err);
            return res.status(500).json(error({requestId: req.id, code: 500, message: err.message}));}
        if(response === 0) {return res.status(404).json(error({requestId: req.id, code: 404}));}
        User.findById(user_id).then(user=>{
                const {authorizationToken, accessToken} = generateTokens(user);
                const newKey = `{${user._id}}{SESSION}{${accessToken}}`;
                    redis.setSessionTokenKey(newKey, authorizationToken, (redisError)=>{
                        if(redisError) {logger.error(redisError); return res.status(500).json(error({requestId: req.id, code: 500, message: redisError.message}));}
                        req.accessToken = accessToken;
                        next();
                    });
                })
.catch(mongoError=> {
    logger.error(mongoError);
    res.status(500).json(error({requestId: req.id, code: 500, message: mongoError.message}));});

    });
};

module.exports = refreshSession;