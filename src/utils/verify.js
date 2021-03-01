const User = require('../db/models/user')
const redis = require('./redis')

const verifyAccount = (req, res, next)  => {
    const code = req.params.verificationCode
    redis.getValidationCodeValue(code, async (error, value) => {
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
        // const [err, user] = await to(getUserByEmail(value))
        const user = await User.findOne({ email: value})
        user.active = true
        await user.save()
        redis.removeKey(code, (error, response) => {
            if(error || response !== 1) {
                return res
                .status(500)
                .json({
                    success: false,
                    error: {
                        message: "Server error"
                    }
                })
            }
            next()     
        })
        

    })
}

module.exports =  verifyAccount