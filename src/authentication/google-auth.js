const express = require('express')
const passport = require('passport')
const router = express.Router()
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../db/models/user')
const authUtils = require('../utils/auth')
const ROLES = require('../db/models/static/roles')

const strategyOptions = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_API_URL}/auth/google/callback`,
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
            role: ROLES.Customer,
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

passport.use(new GoogleStrategy(strategyOptions, verifyCallback))

router.get(
    `${process.env.BASE_API_URL}/auth/google`,
    passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    })
)

router.get(
    `${process.env.BASE_API_URL}/auth/google/callback`,
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
        //console.log('callback===')
        const tokens = await authUtils.generateTokens(req.user) //createTokens(req.user)

        // res.status(200)
        //     .redirect(req.headers.referer+getRedirectUrl(req.user.role)+'?accessToken=' + tokens.accessToken + '&refreshToken=' + tokens.refreshToken)
        res.status(200).send({accessToken: tokens.accessToken, refreshToken: tokens.refreshToken})
    }
)

module.exports = router