const jwt = require('jsonwebtoken')
const error = require('../utils/response').error

const validateSession = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res
            .status(403)
            .json(error({ requestId: req.id, code: 403, message: 'Missing auth header' }))
    }
    const refreshToken = authHeader.split(' ')[1]
    jwt.verify(refreshToken, process.env.JWT_SESSION_SECRET, (err, id) => {
        if (err) {
            if(err.name === 'TokenExpiredError') {
                return res
                    .status(403)
                    .json(error({ requestId: req.id, code: 401, message: 'Token expired' }))
            }
            return res
            .status(403)
            .json(error({ requestId: req.id, code: 403, message: 'Token not valid' }))
        }
        req.user_id = id.data
        next()
    })
}

module.exports =  validateSession