const User = require('../db/models/user')
const redis = require('./redis')

const verifyAccount = (req, res, next)  => {
    if (!req.query.email) {
        return res
            .status(404)
            .json({
                success: false,
                error: {
                    message: "Missing email!"
                }
            })
    }
    
    if (!req.query.code) {
        return res
        .status(404)
        .json({
            success: false,
            error: {
                message: "Missing code!"
            }
        })
    }
    const code = `{${req.query.email}}{VALIDATIONCODE}`
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

        if (req.query.code != value) {
            return res
            .status(404)
            .json({
                success: false,
                error: {
                    message: "Invalid Code"
                }
            })
        }

        const user = await User.findOne({ email: req.query.email})
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