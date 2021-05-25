
const User = require('../db/models/user');
const {error} = require('../utils/response');
const bcrypt = require('bcryptjs');
const {PASSWORD_DOES_NOT_MATCH, PASSWORD_CHANGE_CANT_BE_SAME} = require('../utils/consts');

const validatePasswordChange = async (req, res, next) => {
        const {currentPassword, newPassword, confirmNewPassword} = req.body;
        if (!currentPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword) {
            return res
                .status(400)
                .json(error({requestId: req.id, code: 400}));
        }

        const user  = await User.findById(req.user_id);
        if (!user) {
            return res
            .status(404)
            .json(error({ requestId: req.id, code: 404}));
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (!isMatch || isSamePassword) {
            return res.status(422).json(error({requestId: req.id, code: 422, message: isSamePassword? PASSWORD_CHANGE_CANT_BE_SAME : PASSWORD_DOES_NOT_MATCH }));
        }

        req.user =  user;
        next();
};

module.exports = validatePasswordChange;
