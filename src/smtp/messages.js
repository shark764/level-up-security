const randToken = require('rand-token')
const url = require('url')
const redis = require('../utils/redis')
const mailer = require('./mailer')
const logger = require('../logging/logger')

const verificationEmail =  (user, protocol, host) => {
    console.log("email verification")
    const verificationCode = randToken.uid(128)
    const verificationURL = url.format({
        protocol: protocol,
        host: host,
        pathname: process.env.VERIFICATION_ROUTE,
    })
    const text = verificationURL + '?code=' + verificationCode + '&email='+ user.email
    const message = mailer.createMessage({
        to: user.email,
        subject: 'Account needs validation',
        text: text
    })

    mailer.sendMail(message, (error, info) => {
        if (error) {
            logger.error(error)
        }
        redis.setValidationCode(`{${user.email}}{VALIDATIONCODE}`, verificationCode)

    })

}

module.exports = { verificationEmail }