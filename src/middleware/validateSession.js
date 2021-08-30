const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

const validateSession = (req, res, next) => {
  const { accessToken } = res.locals;

  jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, id) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json(error({ requestId: req.id, code: 401 }));
      }
      // this goes more into our side.
      return res
        .status(500)
        .json(error({ requestId: req.id, code: 500, message: err.message }));
    }
    res.locals.userId = id.data;
    next();
  });
};

module.exports = validateSession;
