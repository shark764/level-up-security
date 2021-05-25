const randCode = require('../utils/generateRanCode');
const logger = require('../logging/logger');
const redis = require('../utils/redis');
const mailer = require('./mailer');

const passwordResetCodeEmail =  (user) => {
    const verificationCode = randCode();
    const message = mailer.createMessage({
        to: user.email,
        subject: 'Password reset code',
        text: 'Your verification code is ' + verificationCode
    });

    mailer.sendMail(message, (error) => {
        if (error) {
           logger.error(error);
        }
        redis.setPwdResetVerificationCode(`{${user.email}}{PSWRESETCODE}`, verificationCode);

    });

};

module.exports = { passwordResetCodeEmail };