const jwt = require('jsonwebtoken');
const logger = require('../logging/logger');
const redis = require('./redis');
const { errorObj } = require('./response');

const signAuthorizationToken = (user) => {
  delete user._doc.password;
  return jwt.sign({ data: user }, process.env.JWT_AUTHORIZATION_SECRET, {
    expiresIn: parseInt(process.env.JWT_AUTHORIZATION_TTL),
  });
};

const signAccessToken = (id, authorizationToken) => {
  const refreshToken = jwt.sign({ data: id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: parseInt(process.env.JWT_ACCESS_TTL),
  });
  return new Promise((resolve, reject) => {
    redis.setSessionTokenKey(
      `{${id}}{SESSION}{${refreshToken}}`,
      authorizationToken,
      (error) => {
        if (error) {
          logger.error(error);
          reject(error);
        }
      }
    );
    resolve(refreshToken);
  });
};

const generateTokens = async (user) => {
  const authorizationToken = signAuthorizationToken(user);
  const accessToken = await signAccessToken(user._id, authorizationToken);
  return {
    accessToken,
    authorizationToken,
  };
};

const removeRefreshToken = (userId, refreshToken) => {
  redis.removeKey(
    `{${userId}}{SESSION}{${refreshToken}}`,
    (error, response) => {
      if (error) {
        logger.error(error);
        throw errorObj(500, error.message);
      }
      if (response !== 1) {
        throw errorObj(404);
      }
    }
  );
};

const removeAllUsersSessions = (userId) => {
  redis.deleteKeysByPattern(`{${userId}}{SESSION}*`);
};

module.exports = {
  generateTokens,
  signAuthorizationToken,
  removeRefreshToken,
  removeAllUsersSessions,
};
