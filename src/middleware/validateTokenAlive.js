const jwt = require('jsonwebtoken');
const redis = require('../utils/redis');
const { error } = require('../utils/response');
const logger = require('../logging/logger');

const validateAccessToken = async (req, res, next) => {
  const { accessToken, userId } = res.locals;
  let parsedUserId;
  if (!userId) {
    try {
      const { data } = await jwt.verify(
        accessToken,
        process.env.JWT_ACCESS_SECRET
      );
      parsedUserId = data;
    } catch (jwtError) {
      return res
        .status(500)
        .json(
          error({ requestId: req.id, code: 500, message: jwtError.message })
        );
    }
  }
  const key = `{${userId || parsedUserId}}{SESSION}{${accessToken}}`;
  redis.getKey(key, (err, value) => {
    if (err) {
      logger.error(err);
      return res
        .status(500)
        .json(error({ requestId: req.id, code: 500, message: err.message }));
    }
    if (!value) {
      return res.status(403).json(error({ requestId: req.id, code: 403 }));
    }
    res.locals.authToken = value;
    res.locals.key = key;
    res.locals.userId = userId || parsedUserId;
    next();
  });
};

module.exports = validateAccessToken;
