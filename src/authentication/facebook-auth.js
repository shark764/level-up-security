const express = require('express');
const passport = require('passport');
const router = express.Router();
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../db/models/user');
const authUtils = require('../utils/auth');
const {success} = require('../utils/response');


const strategyOptions = {
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_API_URL}/auth/facebook/callback`,
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
      
    
        if (userExists) {return done(null, userExists);}
    
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

passport.use(new FacebookStrategy(strategyOptions, verifyCallback));

router.get(
    `${process.env.BASE_API_URL}/auth/facebook`,
    passport.authenticate('facebook', {
        scope: ['public_profile', 'email']
    })
);

router.get(
    `${process.env.BASE_API_URL}/auth/facebook/callback`,
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    async (req, res) => {
       try{
        const {accessToken, authorizationToken} = await authUtils.generateTokens(req.user);
        res.json(success({requestId: req.id, data: {accessToken, authorizationToken}}));
       }catch(error) {
           res.statusCode(error.statusCode? error.statusCode : 500)
           .json(error(
               {requestId: req.id,
                 code: error.statusCode ? error.statusCode : 500,
                 message: error.message}));
       }

    }
);

module.exports = router;