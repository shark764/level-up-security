const { error } = require('../utils/response');

const validateAccessHeader = (req, res, next) => {
  const accessHeader = req.headers.access;

  if (!accessHeader) {
    return res.status(422).json(error({ requestId: req.id, code: 422 }));
  }
  const [, accessToken] = accessHeader.split(' ');
  res.locals.accessToken = accessToken;
  next();
};

module.exports = validateAccessHeader;
