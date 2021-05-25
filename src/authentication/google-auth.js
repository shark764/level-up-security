const express = require('express');
const passport = require('passport');
const router = express.Router();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../db/models/user');
const authUtils = require('../utils/auth');
const {error, success} = require('../utils/response');

const strategyOptions = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_API_URL}/auth/google/callback`,
    profileFields: ['id', 'emails', 'name']
};

const verifyCallback = async (
    accessToken,
    refreshToken,
    profile,
    done
) => {  
    try {
        const userExists = await User.findOne({ providerId: profile.id });
        
        if (userExists)  {return done(null, userExists);}
           
    
        const verifiedEmail = profile.emails.find(email => email.verified) || profile.emails[0];
        
        const userToCreate = new User ({
            provider: profile.provider,
            providerId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            displayName: profile.displayName,
            email: verifiedEmail.value,
            password: null,
            active: true
        });
    
        await userToCreate.save(userToCreate);
        return done(null, userToCreate);
    } catch (err) {
        return done(err, null);
    }
};

passport.use(new GoogleStrategy(strategyOptions, verifyCallback));

router.get(
    `${process.env.BASE_API_URL}/auth/google`,
    passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    })
);

router.get(
    `${process.env.BASE_API_URL}/auth/google/callback`,
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
        try{
            
            const {authorizationToken, accessToken} = await authUtils.generateTokens(req.user);
            res.json(success({requestId: req.id, data: {accessToken, authorizationToken}}));

        }catch(e) {
            res.json(e.statusCode? e.statusCode: 500).json(error({requestId: req.id,
                code: e.statusCode? e.statusCode : 500, 
                message: e.message }));
        }
       
    }
);

module.exports = router;