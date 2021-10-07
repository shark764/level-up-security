const NodeMailer = require('nodemailer');
const { DEV_MODE } = require('../utils/consts');

const transport = NodeMailer.createTransport(
  {
    host: process.env.SERVICE,
    secure: true,
    port: process.env.SERVICE_PORT,
    auth: {
      user: process.env.USER_SERVICE,
      pass: process.env.USER_SERVICE_PASSWORD,
    },
  } 
);

const sendMail = (message, callback) => {
  transport.sendMail(message, callback);
};

const createMessage = (args) =>
  // validation is missing
  ({
    from: process.env.EMAIL_SENDER,
    to: args.to,
    subject: args.subject,
    text: args.text,
  });

module.exports = { sendMail, createMessage };
