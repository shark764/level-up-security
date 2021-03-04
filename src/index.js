require("dotenv").config()
const express = require('express')
const morgan = require('morgan')
const logger = require('./logging/logger');
const success = require('./utils/response').success
const error = require('./utils/response').error
require('./db/mongoose')
const passport = require('passport')
const facebookRouter = require('./authentication/facebook-auth')
const googleRouter = require('./authentication/google-auth')
const authRouter = require('./routers/auth')
const validateRoles = require('./middleware/validateRoles')
const validateAccess = require('./middleware/validateAccess')
const ROLES = require('./db/models/static/roles')
const addRequestId = require('express-request-id')();

const app = express()
const port = 3000

app.use(addRequestId);
morgan.token('req_id', function (req, res) { return req.id})

app.use(
    morgan(logger.morganFormat, {
        stream: logger.accessLogStream
    })
);

app.use(passport.initialize())
app.use(passport.session())
app.use(express.json())



passport.serializeUser(function (user, cb) {
    cb(null, user);
});
  
passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});

app.use(facebookRouter)
app.use(googleRouter)
app.use(authRouter)

app.get('/admin-test', validateAccess, validateRoles(ROLES.Admin), (req, res) => {
    return res
        .status(200)
        .json(success({ requestId: req.id }))
})

app.get('/customer-test', validateAccess, validateRoles(ROLES.Customer), (req, res) => {
    return res
        .status(200)
        .json(success({ requestId: req.id }))
})

app.get('/both-test', validateAccess, validateRoles(ROLES.Customer, ROLES.Admin), (req, res) => {
    return res
        .status(200)
        .json(success({ requestId: req.id }))
})

app.listen(port, () => {
    console.log('Server is up running on port ' + port)
})