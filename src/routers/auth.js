const express = require('express')
const validator = require('validator')
const success = require('../utils/response').success
const error = require('../utils/response').error
const User = require('../db/models/user')
const router = express.Router()
const messages = require('../smtp/messages')
const validateSession = require('../middleware/validateSession')
const validateTokenAlive = require('../middleware/validateTokenAlive')
const validatePasswordResetCode = require('../middleware/validatePasswordResetCode')
const verifyAccount = require('../utils/verify')
const authUtils = require('../utils/auth')
const passwordResetEmail = require('../smtp/passwordResetCode')

router.post(`${process.env.BASE_API_URL}/auth/login`, async (req, res) => {    
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const { refreshToken, accessToken} = await authUtils.generateTokens(user)
        
        if(!user.active) {
            return res
            .status(401)
            .json(error({requestId: req.id, code: 401, message: "User not validated"}))
        }

        return res
            .status(200)
            .json(success({
                requestId: req.id, 
                data: { refreshToken: refreshToken, accessToken: accessToken }
            }))
    } catch (err) {
        return res
            .status(401)
            .json(error({requestId: req.id, code: 401, message: "Login Error"}))
    }

})

router.post(`${process.env.BASE_API_URL}/auth/register`, async (req, res) => {
    

    try {        
        const user = await User.newUser(req.body)

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

router.get(`${process.env.BASE_API_URL}/auth/verify/`, verifyAccount, (req, res) => {

    return res
        .status(200)
        .json(success({ requestId: req.id }))
})

// POST /auth/newverificationcode?email=test@test.com
router.post(`${process.env.BASE_API_URL}/auth/newverificationcode`, async (req, res) => {
    if (!req.query.email) {
        return res.status(404).send()
    }

    const user = await User.findOne({ email: req.query.email })
    if (!user) {
        return res
            .status(404)
            .json(error({requestId: req.id, code: 404, message: "User not found"}))
    }

    // send new email with verification code
    messages.verificationEmail(user, req.protocol, req.get('host'))

    res
        .status(200)
        .json(success({ requestId: req.id }))
})

// POST /auth/passwordreset?email=test@test.com
router.post(`${process.env.BASE_API_URL}/auth/passwordreset`, async (req, res) => {
    if (!req.query.email) {
        return res.status(400)
            .json(error({ requestId: req.id, code: 400, message: 'Email required' }))
    }

    const user = await User.findOne({ email: req.query.email })
    if (!user) {
        return res.status(400)
            .json(error({ requestId: req.id, code: 400, message: 'Email is not registered' }))

    }

    passwordResetEmail.passwordResetCodeEmail(user, req.protocol, req.get('host'))

    res
        .status(200)
        .json(success({ requestId: req.id }))
})

// POST /auth/newpassword?code=ER87TL&email=test@test.com&password=newpassword&confirmpassword=newpassword
router.post(`${process.env.BASE_API_URL}/auth/newpassword`, validatePasswordResetCode, async (req, res) => {    
    try {
        if (!validator.equals(req.body.password, req.body.confirmpassword)) {
            return res
                .status(400)
                .json(error({ requestId: req.id, code: 400, message: 'Passwords dont match' }))
            
        }
    
        await User.updatePassword(req.user, req.body.password)
        authUtils.removeAllUsersSessions(req.user._id)
    
        res
            .status(200)
            .json(success({ requestId: req.id }))
    } catch (err) {
        res.status(400).json(error({ requestId: req.id, code: 400, message: err }))
    }
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
        .json(success({ requestId: req.id }))
})

router.get(`${process.env.BASE_API_URL}/auth/logout_all`, validateSession, validateTokenAlive, (req, res) => {
    authUtils.removeAllUsersSessions(req.user_id)
    return res
        .status(200)
        .json(success({ requestId: req.id }))
})


module.exports = router