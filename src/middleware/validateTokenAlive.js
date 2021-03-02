const redis = require('../utils/redis')
const error = require('../utils/response').error

const validateRefreshToken = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res
            .status(403)
            .json(error({ requestId: req.id, code: 403, message: 'Missing auth header' }))
    }
    const refreshToken = authHeader.split(' ')[1]
    redis.getRefreshTokenValue(`{${req.user_id}}{SESSION}{${refreshToken}}`, (err, value) => {
        if(err) {
            //logic
            return
        }
        if (!value) {
            return res
            .status(401)
            .json(error({ requestId: req.id, code: 401, message: 'Token expired' }))
        }
        req.refreshToken = refreshToken
        next()           
    })
}

module.exports =  validateRefreshToken