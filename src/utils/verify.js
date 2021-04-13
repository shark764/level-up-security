const User = require('../db/models/user')
const redis = require('./redis')
const success = require('./response').success
const error = require('./response').error
//.json(error({requestId: req.id, code: 401, message: "Login Error"}))
const verifyAccount = (req, res, next)  => {
    if (!req.query.email) {
        return res
            .status(404)
            .json(error({requestId: req.id, code: 404, message: 'Missing email!'}))
    }
    
    if (!req.query.code) {
        return res
        .status(401)
        .json(error({requestId: req.id, code: 401, message: 'Missing code!'}))
    }
    const code = `{${req.query.email}}{VALIDATIONCODE}`
    redis.getValidationCodeValue(code, async (err, value) => {
        if (err) {
            //logic
            return res
                    .status(500)
                    .json(error({requestId: req.id, code: 500, message: 'Server error'}))
        }
        if (!value) {
            return res
                .status(404)
                .json(error({requestId: req.id, code: 404, message: 'Invalid Code'}))
        }
        // const [err, user] = await to(getUserByEmail(value))

        if (req.query.code != value) {
            return res
                .status(404)
                .json(error({requestId: req.id, code: 404, message: 'Invalid Code'}))
        }

        const user = await User.findOne({ email: req.query.email})
        user.active = true
        await user.save()
        redis.removeKey(code, (err, response) => {
            if(err || response !== 1) {
                return res
                    .status(500)
                    .json(error({requestId: req.id, code: 500, message: 'Server error'}))
            }
            next()     
        })
        

    })
}

module.exports =  verifyAccount