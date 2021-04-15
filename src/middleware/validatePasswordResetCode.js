const redis = require('../utils/redis')
const User = require('../db/models/user')
const success = require('../utils/response').success
const error = require('../utils/response').error
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const validatePasswordResetCode = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (authHeader) {
        const accessToken = authHeader.split(' ')[1]
        if (!req.body.currentPassword) {
            return res
                .status(400)
                .json(error({requestId: req.id, code: 400, message: 'Missing current password'}))
        }
        jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, async (err, user) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res
                        .status(401)
                        .json(error({ requestId: req.id, code: 401, message: 'Token expired' }))
                }
                return res
                    .status(403)
                    .json(error({ requestId: req.id, code: 403, message: 'Token not valid' }))
            }
            req.user = await User.findOne({ email: user.data.email})
            const isMatch = await bcrypt.compare(req.body.currentPassword, req.user.password)
            if (!isMatch) {
                return res
                    .status(400)
                    .json(error({ requestId: req.id, code: 400, message: 'Current password is not valid' }))
            }
            next()
        })
    } else {
        if (!req.body.code) {
            return res
                .status(400)
                .json(error({requestId: req.id, code: 400, message: 'Missing validation code'}))
        }

        if (!req.body.email) {
            return res
                .status(400)
                .json(error({requestId: req.id, code: 400, message: 'Missing email'}))
        }

        
        redis.getValidationCodeValue(`{${req.body.email}}{PSWRESETCODE}`, async (err, value) => {
            if (err) {
                //logic
                return res
                        .status(500)
                        .json(error({requestId: req.id, code: 400, message: 'Server Error'}))
            }
            if (!value) {
                return res
                .status(404)
                .json(error({requestId: req.id, code: 404, message: 'Invalid code or email'}))
            }

            if (req.body.code != value) {
                return res
                .status(404)
                .json(error({requestId: req.id, code: 404, message: 'Code does not match'}))
            }

            const user = await User.findOne({ email: req.body.email})

            req.user = user
            next()
        })
    }
}

module.exports = validatePasswordResetCode
