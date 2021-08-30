require('dotenv').config();
require('./db/mongoose');
const express = require('express');
const morgan = require('morgan');
const passport = require('passport');
const addRequestId = require('express-request-id')();
const cors = require('cors');
const logger = require('./logging/logger');
const facebookRouter = require('./authentication/facebook-auth');
const googleRouter = require('./authentication/google-auth');
const authRouter = require('./routers/auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(addRequestId);
morgan.token('req_id', (req) => req.id);

app.use(
  morgan(logger.morganFormat, {
    stream: logger.accessLogStream,
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

app.listen(port, () => {
  console.log(`Server is up running on port ${port}`);
});
