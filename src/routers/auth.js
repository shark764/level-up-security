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

const router = express.Router();

router.post(`${process.env.BASE_API_URL}/auth/login`, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(error({ requestId: req.id, code: 400 }));
    }
    const user = await User.findByCredentials(email, password);
    const { authorizationToken, accessToken } = await authUtils.generateTokens(
      user
    );

    if (!user.active) {
      return res
        .status(403)
        .json(
          error({ requestId: req.id, code: 403, message: EMAIL_CONFIRMATION })
        );
    }

    return res.json(
      success({
        requestId: req.id,
        data: { authorizationToken, accessToken },
      })
    );
  } catch (err) {
    return res.status(err.statusCode ? err.statusCode : 500).json(
      error({
        requestId: req.id,
        code: err.statusCode ? err.statusCode : 500,
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
    return res.status(e.statusCode ? e.statusCode : 500).json(
      error({
        requestId: req.id,
        code: e.statusCode ? e.statusCode : 500,
        message: e.message,
      })
    );
  }
});

router.put(
  `${process.env.BASE_API_URL}/auth/verify/`,
  verifyAccount,
  (req, res) => res.json(success({ requestId: req.id }))
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
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json(error({ requestId: req.id, code: 404 }));
      }

      verificationEmail(email);

      return res.json(success({ requestId: req.id }));
    } catch (e) {
      return res.json(e.statusCode ? e.statusCode : 500).json(
        error({
          requestId: req.id,
          code: e.statusCode ? e.statusCode : 500,
          message: e.message ? e.message : e,
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

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json(error({ requestId: req.id, code: 404 }));
      }

      passwordResetEmail.passwordResetCodeEmail(email);

      return res.json(success({ requestId: req.id }));
    } catch (e) {
      return res
        .status(e.statusCode ? e.statusCode : 500)
        .json(
          error({
            requestId: req.id,
            code: e.statusCode ? e.statusCode : 500,
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
      redis.removeKey(req.key);
      await User.updatePassword(req.user, password);
      authUtils.removeAllUsersSessions(req.user._id);

      return res.json(
        success({
          requestId: req.id,
        })
      );
    } catch (err) {
      res
        .status(err.statusCode ? err.statusCode : 500)
        .json(
          error({
            requestId: req.id,
            code: err.statusCode ? err.statusCode : 500,
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
      await User.updatePassword(req.user, req.body.newPassword);
      authUtils.removeAllUsersSessions(req.user._id);

      return res.json(
        success({
          requestId: req.id,
        })
      );
    } catch (err) {
      res
        .status(err.statusCode ? err.statusCode : 500)
        .json(
          error({
            requestId: req.id,
            code: err.statusCode ? err.statusCode : 500,
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
    const { accessToken } = req;
    return res.json(success({ requestId: req.id, data: { accessToken } }));
  }
);

router.post(
  `${process.env.BASE_API_URL}/auth/logout`,
  [validateExistenceAccessHeader, validateSession, validateTokenAlive],
  async (req, res) => {
    try {
      await authUtils.removeRefreshToken(req.user_id, req.accessToken);
      return res.json(
        success({
          requestId: req.id,
        })
      );
    } catch (err) {
      return res
        .status(err.statusCode ? err.statusCode : 500)
        .json(
          error({
            requestId: req.id,
            code: err.statusCode ? err.statusCode : 500,
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
    authUtils.removeAllUsersSessions(req.user_id);
    return res.json(
      success({
        requestId: req.id,
      })
    );
  }
);

module.exports = router;
