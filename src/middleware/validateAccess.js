const jwt = require('jsonwebtoken')

const validateAccess = (req, res, next) => {
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
    const accessToken = authHeader.split(' ')[1]
    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, user) => {
        if (err) {
            if(err.name === 'TokenExpiredError') {
                return res
                    .status(401)
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
        req.user = user
        next()
    })
}

module.exports = validateAccess