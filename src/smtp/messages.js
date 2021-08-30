const randToken = require('rand-token');
const redis = require('../utils/redis');
const mailer = require('./mailer');
const logger = require('../logging/logger');
const { ACCOUNT_VERIFICATION } = require('./consts');
const { EMAIL_CONFIRMATION_BODY } = require('./consts');

const verificationEmail = (email) => {
  const verificationCode = randToken.uid(4);
  const text = EMAIL_CONFIRMATION_BODY(verificationCode);
  const message = mailer.createMessage({
    to: email,
    subject: ACCOUNT_VERIFICATION,
    text,
  });

  mailer.sendMail(message, (error) => {
    if (error) return logger.error(error);
    redis.setValidationCode(`{${email}}{VALIDATIONCODE}`, verificationCode);
  });
};

module.exports = { verificationEmail };
