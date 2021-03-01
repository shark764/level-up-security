const randToken = require('rand-token')
const url = require('url')
const redis = require('../utils/redis')
const mailer = require('./mailer')

const verificationEmail =  (user, protocol, host) => {
    console.log("email verification")
    const verificationCode = randToken.uid(128)
    const verificationURL = url.format({
        protocol: protocol,
        host: host,
        pathname: process.env.VERIFICATION_ROUTE,
    })
    const text = verificationURL + '/' + verificationCode
    const message = mailer.createMessage({
        to: user.email,
        subject: 'Account needs validation',
        text: text
    })

    mailer.sendMail(message, (error, info) => {
        if (error) {
            console.log(error)
        }
        redis.setValidationCode(verificationCode, user.email)

    })

}

module.exports = { verificationEmail }