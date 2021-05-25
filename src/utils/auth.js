const jwt = require('jsonwebtoken');
const redis = require('./redis');
const logger = require('../logging/logger');
const {errorObj} = require('../utils/response');


const signAuthorizationToken = (user) => jwt.sign({ data: user }, process.env.JWT_AUTHORIZATION_SECRET, {
        expiresIn: parseInt(process.env.JWT_AUTHORIZATION_TTL)
    });

const signAccessToken = (id, authorizationToken) => {
    const refreshToken = jwt.sign({ data: id }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: parseInt(process.env.JWT_ACCESS_TTL)
    });
    redis.setSessionTokenKey(
        `{${id}}{SESSION}{${refreshToken}}`, 
        authorizationToken, 
        (error) => {
            if (error) {
                logger.error(error);
               throw(errorObj(500));
                
            }
        });
    return refreshToken;
};

const generateTokens = (user) => {
    const authorizationToken = signAuthorizationToken(user);
    const accessToken = signAccessToken(user._id, authorizationToken);
    return {
        authorizationToken,
        accessToken,
    };
};

const removeRefreshToken = (userId, refreshToken) => {
    redis.removeKey(`{${userId}}{SESSION}{${refreshToken}}`, (error, response) => {
        if(error){
            logger.error(error);
            throw(errorObj(500,error.message));
        }
        if(response !== 1) {
            throw(errorObj(404));
        }
    });
};

const removeAllUsersSessions = (userId) => {
    redis.deleteKeysByPattern(`{${userId}}{SESSION}*`);
    
};


module.exports = { generateTokens, signAuthorizationToken, removeRefreshToken, removeAllUsersSessions };