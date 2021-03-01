const NodeMailer = require('nodemailer')

const transport = NodeMailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
        user: "add yours here",
        pass: "add yours here"
    }
})

const sendMail = (message, callback) => {
    console.log('send email')
    transport.sendMail(message, callback)
}

const createMessage = (args) => {
    // validation is missing
    return {
        from: process.env.EMAIL_SENDER,
        to: args.to,
        subject: args.subject,
        text: args.text
    }
}

module.exports = { sendMail, createMessage }