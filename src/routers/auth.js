const express = require('express');
const { success, error } = require('../utils/response');
const User = require('../db/models/user');
const { verificationEmail } = require('../smtp/messages');
const {
  validateSession,
  validateTokenAlive,
  validatePasswordResetCode,
  validatePasswordChange,
  validateExistenceAccessHeader,
  refreshSession,
} = require('../middleware');
const verifyAccount = require('../utils/verify');
const authUtils = require('../utils/auth');
const passwordResetEmail = require('../smtp/passwordResetCode');
const { EMAIL_CONFIRMATION } = require('../utils/consts');
const redis = require('../utils/redis');
const logger = require('../logging/logger');

const router = express.Router();

router.post(`${process.env.BASE_API_URL}/auth/login`, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json(error({ requestId: req.id, code: 400 }));
    }
    const parsedEmail = email.toLowerCase();
    const user = await User.findByCredentials(parsedEmail, password);
    if (!user.active) {
      return res
        .status(403)
        .json(
          error({ requestId: req.id, code: 403, message: EMAIL_CONFIRMATION })
        );
    }
    const { accessToken } = await authUtils.generateTokens(user);

    return res.json(
      success({
        requestId: req.id,
        data: { accessToken, id: user._id },
      })
    );
  } catch (err) {
    return res.status(err.statusCode || 500).json(
      error({
        requestId: req.id,
        code: err.statusCode || 500,
        message: err.message,
      })
    );
  }
});

router.post(`${process.env.BASE_API_URL}/auth/register`, async (req, res) => {
  try {
    const user = await User.newUser(req.body);

    verificationEmail(user.email);

    return res.json(success({ requestId: req.id, data: user }));
  } catch (e) {
    return res.status(e.statusCode || 500).json(
      error({
        requestId: req.id,
        code: e.statusCode || 500,
        message: e.message,
      })
    );
  }
});

router.put(
  `${process.env.BASE_API_URL}/auth/verify/`,
  verifyAccount,
  async (req, res) => {
    try {
      const { accessToken } = await authUtils.generateTokens(res.locals.user);
      res.json(
        success({
          requestId: req.id,
          data: { accessToken, _id: res.locals.user._id },
        })
      );
    } catch (e) {
      res.status(e.statusCode || 500).json(
        error({
          requestId: req.id,
          code: e.statusCode || 500,
          message: e.message,
        })
      );
    }
  }
);

// POST /auth/newverificationcode?email=test@test.com
router.post(
  `${process.env.BASE_API_URL}/auth/newverificationcode`,
  async (req, res) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json(error({ requestId: req.id, code: 400 }));
    }

    try {
      const parsedEmail = email.toLowerCase();
      const user = await User.findOne({ email: parsedEmail });
      if (!user) {
        return res.status(404).json(error({ requestId: req.id, code: 404 }));
      }

      verificationEmail(user.email);

      return res.json(success({ requestId: req.id }));
    } catch (e) {
      return res.json(e.statusCode || 500).json(
        error({
          requestId: req.id,
          code: e.statusCode || 500,
          message: e.message,
        })
      );
    }
  }
);

router.post(
  `${process.env.BASE_API_URL}/auth/password/forgot`,
  async (req, res) => {
    const { email } = req.query;
    try {
      if (!email) {
        return res.status(400).json(error({ requestId: req.id, code: 400 }));
      }
      const parsedEmail = email.toLowerCase();
      const user = await User.findOne({ email: parsedEmail });
      if (!user) {
        return res.status(404).json(error({ requestId: req.id, code: 404 }));
      }

      passwordResetEmail.passwordResetCodeEmail(user.email);

      return res.json(success({ requestId: req.id }));
    } catch (e) {
      return res.status(e.statusCode || 500).json(
        error({
          requestId: req.id,
          code: e.statusCode || 500,
          message: e.message,
        })
      );
    }
  }
);

router.post(
  `${process.env.BASE_API_URL}/auth/password/reset`,
  validatePasswordResetCode,
  async (req, res) => {
    try {
      const { password, confirmPassword } = req.body;
      if (password !== confirmPassword) {
        return res.status(400).json(
          error({
            requestId: req.id,
            code: 400,
          })
        );
      }
      redis.removeKey(res.locals.key);
      await User.updatePassword(res.locals.user, password);
      authUtils.removeAllUsersSessions(res.locals.user._id);

      return res.json(
        success({
          requestId: req.id,
        })
      );
    } catch (err) {
      res.status(err.statusCode || 500).json(
        error({
          requestId: req.id,
          code: err.statusCode || 500,
          message: err.message,
        })
      );
    }
  }
);

// POST /auth/newpassword?code=ER87TL&email=test@test.com&password=newpassword&confirmpassword=newpassword
router.post(
  `${process.env.BASE_API_URL}/auth/password/change`,
  [
    validateExistenceAccessHeader,
    validateSession,
    validateTokenAlive,
    validatePasswordChange,
  ],
  async (req, res) => {
    try {
      await User.updatePassword(res.locals.user, req.body.newPassword);
      authUtils.removeAllUsersSessions(res.locals.userId);

      return res.json(
        success({
          requestId: req.id,
        })
      );
    } catch (err) {
      res.status(err.statusCode || 500).json(
        error({
          requestId: req.id,
          code: err.statusCode || 500,
          message: err.message,
        })
      );
    }
  }
);

router.get(
  `${process.env.BASE_API_URL}/auth/refresh`,
  [validateExistenceAccessHeader, validateTokenAlive, refreshSession],
  (req, res) => {
    const { accessToken, userId } = res.locals;
    return res.json(
      success({ requestId: req.id, data: { accessToken, _id: userId } })
    );
  }
);

router.post(
  `${process.env.BASE_API_URL}/auth/logout`,
  [validateExistenceAccessHeader, validateSession, validateTokenAlive],
  (req, res) => {
    try {
      authUtils.removeRefreshToken(res.locals.userId, res.locals.accessToken);
      return res.json(
        success({
          requestId: req.id,
        })
      );
    } catch (err) {
      return res.status(err.statusCode || 500).json(
        error({
          requestId: req.id,
          code: err.statusCode || 500,
          message: err.message,
        })
      );
    }
  }
);

router.post(
  `${process.env.BASE_API_URL}/auth/logout_all`,
  [validateExistenceAccessHeader, validateSession, validateTokenAlive],

  (req, res) => {
    authUtils.removeAllUsersSessions(res.locals.userId);
    return res.json(
      success({
        requestId: req.id,
      })
    );
  }
);

router.post(`${process.env.BASE_API_URL}/auth/verifycode`, (req, res) => {
  const { email, code } = req.body;
  const parsedEmail = email.toLowerCase();
  const key = `{${parsedEmail}}{PSWRESETCODE}`;
  redis.getKey(key, (err, value) => {
    if (err) {
      logger.error(err);
      return res
        .status(500)
        .json(error({ requestId: req.id, code: 500, message: err.message }));
    }
    if (!value) {
      return res.status(404).json(error({ requestId: req.id, code: 404 }));
    }
    if (value !== code) {
      return res.status(401).json(error({ requestId: req.id, code: 401 }));
    }
    res.json(success({ requestId: req.id }));
  });
});
module.exports = router;
