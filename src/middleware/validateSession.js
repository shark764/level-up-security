const jwt = require('jsonwebtoken')

const validateSession = (req, res, next) => {
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
    jwt.verify(refreshToken, process.env.JWT_SESSION_SECRET, (err, id) => {
        if (err) {
            if(err.name === 'TokenExpiredError') {
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
            return res
            .status(403)
            .json({
                request_id: req.id,
                success: false,
                error: {
                    message: "Token not valid"
                }
            })
        }
        req.user_id = id.data
        next()
    })
}

module.exports =  validateSession