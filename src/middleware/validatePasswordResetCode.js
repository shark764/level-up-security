const redis = require('../utils/redis')
const User = require('../db/models/user')

const validatePasswordResetCode = (req, res, next) => {
    if (!req.query.code) {
        return res.status(400).send()
    }

    redis.getValidationCodeValue(req.query.code, async (error, value) => { 
        if (error) {
            //logic
            return res
                    .status(500)
                    .json({
                        success: false,
                        error: {
                            message: "Server error"
                        }
                    })
        }
        if (!value) {
            return res
            .status(404)
            .json({
                success: false,
                error: {
                    message: "Invalid Code"
                }
            })
        }

        const user = await User.findOne({ email: value})

        req.user = user
        next()
    })
}

module.exports = validatePasswordResetCode