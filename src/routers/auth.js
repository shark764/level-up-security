const express = require('express')
const success = require('../utils/response').success
const error = require('../utils/response').error
const User = require('../db/models/user')
const router = express.Router()
const messages = require('../smtp/messages')
const validateSession = require('../middleware/validateSession')
const validateTokenAlive = require('../middleware/validateTokenAlive')
const verifyAccount = require('../utils/verify')
const authUtils = require('../utils/auth')

router.post(`${process.env.BASE_API_URL}/auth/login`, async (req, res) => {    
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const tokens = await authUtils.generateTokens(user)
        
        if(!user.active) {
            return res
            .status(401)
            .json(error({requestId: req.id, code: 401, message: "User not validated"}))
        }

        return res
            .status(200)
            .json(success({
                requestId: req.id, 
                data: { refreshToken: tokens.refreshToken, accessToken: tokens.accessToken }
            }))
    } catch (err) {
        return res
            .status(401)
            .json(error({requestId: req.id, code: 401, message: "Login Error"}))
    }

})

router.post(`${process.env.BASE_API_URL}/auth/register`, async (req, res) => {
    

    try {
        const user = await User.newUser(req.body); 

        messages.verificationEmail(user, req.protocol, req.get('host'))

        return res
            .status(201)
            .json(success({ requestId: req.id, data: user }))
    } catch (e) {
        return res
            .status(400)
            .json(error({ requestId: req.id, code: 400, message: e }))
    }

})

router.get(`${process.env.BASE_API_URL}/auth/verify/:verificationCode`, verifyAccount, (req, res) => {

    return res
        .status(200)
        .json(success({ requestId: req.id }))
})

router.get(`${process.env.BASE_API_URL}/auth/refresh`, validateSession, validateTokenAlive, async(req, res) => {
    const user = await User.getUserById(req.user_id);
    if(!user) {
        return res
            .status(401)
            .json(error({ requestId: req.id, code: 401, message: 'Forbidden' }))
    }
    const accessToken = authUtils.signAccessToken(user)
    return res
        .status(200)
        .json(success({ requestId: req.id, data: { accessToken: accessToken } }))
})

router.get(`${process.env.BASE_API_URL}/auth/logout`, validateSession, validateTokenAlive, (req, res) => {
    authUtils.removeRefreshToken(req.user_id, req.refreshToken)
    return res
        .status(200)
        .json(success({ request_id: req.id }))
})

router.get(`${process.env.BASE_API_URL}/auth/logout_all`, validateSession, validateTokenAlive, (req, res) => {
    authUtils.removeAllUsersSessions(req.user_id)
    return res
        .status(200)
        .json(success({ request_id: req.id }))
})


module.exports = router