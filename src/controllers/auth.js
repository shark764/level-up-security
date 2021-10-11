const { success, error } = require('../utils/response');
const authHelpers = require('../helpers/auth');

const controllers = {
  me: async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(error({ requestId: req.id, code: 400 }));
    }

    try {
      const user = await authHelpers.getMe(email);

      if (!user) {
        return res.status(404).json(error({ requestId: req.id, code: 404 }));
      }

      return res.json(
        success({
          requestId: req.id,
          data: {
            user,
          },
        })
      );
    } catch (e) {
      return res.json(e.statusCode || 500).json(
        error({
          requestId: req.id,
          code: e.statusCode || 500,
          message: e.message,
        })
      );
    }
  },
};

module.exports = controllers;
