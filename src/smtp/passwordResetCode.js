const randCode = require('../utils/generateRanCode');
const logger = require('../logging/logger');
const redis = require('../utils/redis');
const mailer = require('./mailer');
const { PASSWORD_RESET_CODE, PASSWORD_RESET_BODY } = require('./consts');


const passwordResetCodeEmail =  (email) => {
    const verificationCode = randCode();
    const message = mailer.createMessage({
        to: email,
        subject: PASSWORD_RESET_CODE,
        text:  `${PASSWORD_RESET_BODY} ${verificationCode}`
    });

    mailer.sendMail(message, (error) => {
        if (error) {
           logger.error(error);
        }
        redis.setPwdResetVerificationCode(`{${email}}{PSWRESETCODE}`, verificationCode);

    });

};

module.exports = { passwordResetCodeEmail };