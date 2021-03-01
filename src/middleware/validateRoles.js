const checkIsInRole = (...roles) => (req, res, next) => {

    if (!req.user) {
        return res
        .status(403)
        .json({
            request_id: req.id,
            success: false,
            error: {
                message: "Not Authorized"
            }
        })
    }
    const hasRole = roles.find(role => req.user.data.role === role)
    if (!hasRole) {
        return res
        .status(403)
        .json({
            request_id: req.id,
            success: false,
            error: {
                message: "Not Authorized"
            }
        })
    }
    
    return next()
}

module.exports = checkIsInRole