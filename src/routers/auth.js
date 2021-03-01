const express = require('express')
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
        console.log(tokens)
        res.json({
            request_id: req.id,
            refreshToken: tokens.refreshToken,
            accessToken: tokens.accessToken
        })
    } catch (err) {
        //console.log(err)
        res.status(401).json({
            request_id: req.id,
        })
    }

})

router.post(`${process.env.BASE_API_URL}/auth/register`, async (req, res) => {
    

    try {
        const user = await User.newUser(req.body); 

        messages.verificationEmail(user, req.protocol, req.get('host'))

        return res
            .status(201)
            .json({
                request_id: req.id,
                sucess: true,
                data: {
                    user
                }
            })
    } catch (e) {
        //console.log(e)
        return res
            .status(400)
            .json({
                request_id: req.id,
                sucess: false,
                error: {
                    message: e
                }
            })
    }

})

router.get(`${process.env.BASE_API_URL}/auth/verify/:verificationCode`, verifyAccount, (req, res) => {

    return res
        .status(200)
        .json({
            request_id: req.id,
            success: true,
        })
})

router.get(`${process.env.BASE_API_URL}/auth/refresh`, validateSession, validateTokenAlive, async(req, res) => {
    const user = await User.getUserById(req.user_id);
    if(!user) {
        return res
        .status(401)
        .json({
            request_id: req.id,
            success: false,
            error: {
                message: "Forbidden"
            }
        })
    }
    const accessToken = authUtils.signAccessToken(user)
    return res
        .status(200)
        .json({
            request_id: req.id,
            success: true,
            data: {
                accessToken: accessToken
            }
        })
})

router.get(`${process.env.BASE_API_URL}/auth/logout`, validateSession, validateTokenAlive, (req, res) => {
    authUtils.removeRefreshToken(req.user_id, req.refreshToken)
    return res
        .status(200)
        .json({
            request_id: req.id,
            success: true
        })
})

router.get(`${process.env.BASE_API_URL}/auth/logout_all`, validateSession, validateTokenAlive, (req, res) => {
    authUtils.removeAllUsersSessions(req.user_id)
    return res
        .status(200)
        .json({
            request_id: req.id,
            success: true
        })
})


module.exports = router