const randToken = require('rand-token');
const url = require('url');
const redis = require('../utils/redis');
const mailer = require('./mailer');
const logger = require('../logging/logger');

const verificationEmail =  (user, protocol, host) => {
    const verificationCode = randToken.uid(128);
    const verificationURL = url.format({
        protocol,
        host,
        pathname: process.env.VERIFICATION_ROUTE,
    });
    const text = verificationURL + '?code=' + verificationCode + '&email='+ user.email;
    const message = mailer.createMessage({
        to: user.email,
        subject: 'Account needs validation',
        text
    });

    mailer.sendMail(message, (error) => {
        if (error) return logger.error(error);
        redis.setValidationCode(`{${user.email}}{VALIDATIONCODE}`, verificationCode);

    });

};

module.exports = { verificationEmail };