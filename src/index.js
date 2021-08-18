require("dotenv").config();
require('./db/mongoose');
const express = require('express');
const morgan = require('morgan');
const logger = require('./logging/logger');
const {success} = require('./utils/response');
const passport = require('passport');
const facebookRouter = require('./authentication/facebook-auth');
const googleRouter = require('./authentication/google-auth');
const authRouter = require('./routers/auth');
const validateRoles = require('./middleware/validateRoles');
const validateAccess = require('./middleware/validateAccess');
const ROLES = require('./db/models/static/roles');
const addRequestId = require('express-request-id')();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(addRequestId);
morgan.token('req_id', (req) => req.id);

app.use(
    morgan(logger.morganFormat, {
        stream: logger.accessLogStream
    })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());



passport.serializeUser((user, cb) => {
    cb(null, user);
});
  
passport.deserializeUser((obj, cb) => {
    cb(null, obj);
});

app.use(facebookRouter);
app.use(googleRouter);
app.use(authRouter);

app.get('/admin-test', validateAccess, validateRoles(ROLES.Admin), (req, res) => res
        .status(200)
        .json(success({ requestId: req.id, data: {message: `User: ${req.user.data.email} is admin! ${req.user.data.role}`} })));

app.get('/customer-test', validateAccess, validateRoles(ROLES.Customer), (req, res) => res
        .status(200)
        .json(success({ requestId: req.id, data: {message: `User: ${req.user.data.email} is ${req.user.data.role}!`} })));

app.get('/both-test', validateAccess, validateRoles(ROLES.Customer, ROLES.Admin), (req, res) => res
        .status(200)
        .json(success({ requestId: req.id, data: {message: `User ${req.user.data.email} is ${req.user.data.role}`} })));

app.listen(port, () => {
    console.log('Server is up running on port ' + port);
});