const login = (req, user) => {
    return new Promise((resolve, reject) => {
        req.login(user, { session: false }, err => {
            if (err) {
                return reject(err)
            }
            if (!user.active) {
                return reject('User need validation, Please check your email')
            }
            const tokens =  user.generateAuthToken()
            console.log(tokens)
            return resolve({
                refreshToken: tokens.refreshToken, //authentication
                accessToken: tokens.accessToken  //autorization
            })
        })
    })
}

module.exports = { login }