const express = require('express')
const passport = require('passport')
const router = express.Router()
const to = 'await-to-js'
const FacebookStrategy = require('passport-facebook').Strategy
const User = require('../db/models/user')
const authUtils = require('../utils/auth')


// const strategyOptions = {
//     clientID: '795806154478863',
//     clientSecret: '5fa69c432f232a02db75aa79314f97a7',
//     callbackURL: `${process.env.SERVER_API_URL}/auth/facebook/callback`,
//     profileFields: ['id', 'emails', 'name']
// }

const strategyOptions = {
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_API_URL}/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'name']
}

const verifyCallback = async (
    accessToken,
    refreshToken,
    profile,
    done
) => {  
    try {
        //console.log(profile)
        const userExists = await User.findOne({ providerId: profile.id })
        //console.log(userExists)
    
        if (userExists) {
            console.log('user exists')
            console.log(userExists)
            return done(null, userExists)
        }
    
        const verifiedEmail = profile.emails.find(email => email.verified) || profile.emails[0]
        
        const userToCreate = new User ({
            provider: profile.provider,
            providerId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            displayName: profile.displayName,
            email: verifiedEmail.value,
            password: null,
            role: 'Customer', // ROLES.Customer
            active: true
        })
    
        await userToCreate.save(userToCreate)
        //console.log(userToCreate)
        return done(null, userToCreate)
    } catch (err) {
        console.log(err)
        return done(err, null)
    }
}

passport.use(new FacebookStrategy(strategyOptions, verifyCallback))

router.get(
    `${process.env.BASE_API_URL}/auth/facebook`,
    passport.authenticate('facebook', {
        scope: ['public_profile', 'email']
    })
)

router.get(
    `${process.env.BASE_API_URL}/auth/facebook/callback`,
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    async (req, res) => {
        //console.log('callback===')
        console.log(req.user)
        const tokens = await authUtils.generateTokens(req.user) //createTokens(req.user)
        console.log('Generating tokens...')
        console.log(tokens)
        // res.status(200)
        //     .redirect(req.headers.referer+getRedirectUrl(req.user.role)+'?accessToken=' + tokens.accessToken + '&refreshToken=' + tokens.refreshToken)
        res.status(200).send({accessToken: tokens.accessToken, refreshToken: tokens.refreshToken})
    }
)

module.exports = router