const redis = require('../utils/redis');
const User = require('../db/models/user');
const { error } = require('../utils/response');
const logger = require('../logging/logger');

const validatePasswordResetCode = (req, res, next) => {
  const { code, email } = req.body;
  if (!code || !email) {
    return res.status(400).json(error({ requestId: req.id, code: 400 }));
  }
  const parsedEmail = email.toLowerCase();
  const key = `{${parsedEmail}}{PSWRESETCODE}`;

  redis.getKey(key, async (err, value) => {
    if (err) {
      logger.error(err);
      return res
        .status(500)
        .json(error({ requestId: req.id, code: 500, message: err.message }));
    }
    if (!value || code !== value) {
      return res.status(404).json(error({ requestId: req.id, code: 404 }));
    }

    const user = await User.findOne({ email: parsedEmail });

    res.locals.user = user;
    res.locals.key = key;
    next();
  });
};

module.exports = validatePasswordResetCode;
