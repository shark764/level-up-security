const redis = require('./redis')
const jwt = require('jsonwebtoken')

const signAccessToken = (user) => {
    return jwt.sign({ data: user }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: parseInt(process.env.JWT_ACCESS_TTL)
    })
}

const signRefreshToken = (id) => {
    const refreshToken = jwt.sign({ data: id }, process.env.JWT_SESSION_SECRET, {
        expiresIn: parseInt(process.env.JWT_SESSION_TTL)
    })
    redis.setKey(
        `{${id}}{SESSION}{${refreshToken}}`, 
        refreshToken, 
        (error, response) => {
            if (error) {
                throw new Error('Server error')
                //console.log(error)
            }
        })
    return refreshToken
}

const generateTokens = (user) => {
    const accessToken = signAccessToken(user)
    const refreshToken = signRefreshToken(user._id)
    return {
        accessToken: accessToken,
        refreshToken: refreshToken
    }
}

const removeRefreshToken = (userId, refreshToken) => {
    redis.removeKey(`{${userId}}{SESSION}{${refreshToken}}`, (error, response) => {
        if(error || response !== 1) {
            //logic
        }
    })
}

const removeAllUsersSessions = (userId) => {
    redis.deleteKeysByPattern(`{${userId}}{SESSION}*`);
    
}


module.exports = { generateTokens, signAccessToken, removeRefreshToken, removeAllUsersSessions }