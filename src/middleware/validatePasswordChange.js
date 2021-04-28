const redis = require('../utils/redis')
const User = require('../db/models/user')
const success = require('../utils/response').success
const error = require('../utils/response').error
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const validatePasswordChange = async (req, res, next) => {
        if (!req.body.currentPassword) {
            return res
                .status(400)
                .json(error({requestId: req.id, code: 400, message: 'Missing current password'}))
        }
        const user  = await User.getUserById(req.user_id)
        if (!user) {
            return res
            .status(400)
            .json(error({ requestId: req.id, code: 400, message: 'User is not valid' }))
        }

        const isMatch = await bcrypt.compare(req.body.currentPassword, user.password)
        if (!isMatch) {
            return res
                .status(400)
                .json(error({ requestId: req.id, code: 400, message: 'Current password is not valid' }))
        }

        const isSamePassword = await bcrypt.compare(req.body.password, user.password)
        console.log(isSamePassword)
        if (isSamePassword) {
            return res
            .status(400)
            .json(error({ requestId: req.id, code: 400, message: 'New password is the same as the current password. Please change it' }))
        }
        req.user =  user
        next()
}

module.exports = validatePasswordChange
