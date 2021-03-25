const randCode = require('../utils/generateRanCode')
const url = require('url')
const redis = require('../utils/redis')
const mailer = require('./mailer')

const passwordResetCodeEmail =  (user, protocol, host) => {
    const verificationCode = randCode()
    // const verificationURL = url.format({
    //     protocol: protocol,
    //     host: host,
    //     pathname: process.env.VERIFICATION_ROUTE,
    // })
    //const text = verificationURL + '/' + verificationCode
    const message = mailer.createMessage({
        to: user.email,
        subject: 'Password reset code',
        text: 'Your verification code is ' + verificationCode
    })

    mailer.sendMail(message, (error, info) => {
        if (error) {
            console.log(error)
        }
        redis.setPwdResetVerificationCode(`{${user.email}}{PSWRESETCODE}`, verificationCode)

    })

}

module.exports = { passwordResetCodeEmail }