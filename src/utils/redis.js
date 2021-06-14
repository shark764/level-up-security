const redis = require('ioredis');
const logger = require('../logging/logger');
const { DEV_MODE } = require('./consts');

const client = DEV_MODE ?  
redis.createClient({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST
}): new redis(`rediss://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DATABASE}`);

const setKey = (key, value, callback) => client.set(key, value, callback);

const setSessionTokenKey = (key, value, callback) => client.set(key, value, 'EX', process.env.JWT_AUTHORIZATION_TTL, callback);

const setValidationCode = (email, code) => {
    client.set(email, code, 'EX', 60 * process.env.REDIS_VERIFICATION_EX_TIME, (err) => {
        if (err) {
           return logger.error(err);
        }
    });
    return code;
};

const setPwdResetVerificationCode = (email, code) => {
    client.set(email, code, 'EX', 60 * process.env.REDIS_PWDRESET_EX_TIME, (err) => {
        if (err) {
            return logger.error(err);
        }
    });
    return code;
};

const getValidationCodeValue = (code, callback) => client.get(code, callback);

const removeKey= (key, callback) => client.del(key, callback);

const getRefreshTokenValue = (token, callback) => client.get(token, callback);

const deleteKeysByPattern = (pattern) => {
    const stream = client.scanStream({ match: pattern });
    let pipeline = client.pipeline();
    let localKeys = [];

    stream.on('data', (resultKeys) => {
        console.log("Data Received", localKeys.length);

        for (let i = 0; i < resultKeys.length; i++) {
            localKeys.push(resultKeys[i]);
            pipeline.del(resultKeys[i]);
        }
        
        if(localKeys.length > 100) {
            pipeline.exec(()=>{console.log("one batch delete complete");});
            localKeys=[];
            pipeline = client.pipeline();
        }
    });
    stream.on('end', () => {
        pipeline.exec(()=>{console.log("final batch delete complete");});
    });
    stream.on('error', (err) => {
        logger.error(err);
    });
};


module.exports = { setKey, setSessionTokenKey, setValidationCode, setPwdResetVerificationCode, getValidationCodeValue, removeKey, getRefreshTokenValue, deleteKeysByPattern };