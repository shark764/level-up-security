const NodeMailer = require('nodemailer')

const transport = NodeMailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
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