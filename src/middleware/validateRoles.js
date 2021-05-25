const {error} = require('../utils/response');

const checkIsInRole = (...roles) => (req, res, next) => {

    if (!req.user) {
        return res
        .status(403)
        .json(error({ requestId: req.id, code: 403, message: 'Not Authorized' }));
    }
    const hasRole = roles.find(role => req.user.data.role === role);
    if (!hasRole) {
        return res
        .status(403)
        .json(error({ requestId: req.id, code: 403, message: 'Not Authorized' }));
    }
    
    return next();
};

module.exports = checkIsInRole;