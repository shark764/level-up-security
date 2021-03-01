const redis = require('../utils/redis')

const validateRefreshToken = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res
            .status(403)
            .json({
                request_id: req.id,
                success: false,
                error: {
                    message: "Missing auth header"
                }
            })
    }
    const refreshToken = authHeader.split(' ')[1]
    redis.getRefreshTokenValue(`{${req.user_id}}{SESSION}{${refreshToken}}`, (error, value) => {
        if(error) {
            //logic
            return
        }
        if (!value) {
            return res
            .status(403)
            .json({
                request_id: req.id,
                success: false,
                error: {
                    message: "Token expired"
                }
            })
        }
        req.refreshToken = refreshToken
        next()           
    })
}

module.exports =  validateRefreshToken