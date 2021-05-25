const User = require('../db/models/user');
const logger = require('../logging/logger');
const redis = require('./redis');
const {error} = require('./response');
const verifyAccount = (req, res, next)  => {
    if (!req.query.email || !req.query.code) {
        return res
            .status(400)
            .json(error({requestId: req.id, code: 400}));
    }
    
  
    const code = `{${req.query.email}}{VALIDATIONCODE}`;
    redis.getValidationCodeValue(code, async (err, value) => {
        if (err) {
            logger.error(err);

            return res
                    .status(500)
                    .json(error({requestId: req.id, code: 500,message: err.message}));
        }
        if (!value || req.query.code !== value) {
            return res
                .status(404)
                .json(error({requestId: req.id, code: 404}));
        }


        const user = await User.findOne({ email: req.query.email});
        user.active = true;
        await user.save();
        redis.removeKey(code, (err, response) => {
            if(err){
                logger.error(err);
                return res.status(500).json(error({requestId: req.id, code:500, message: err.message}));
            }
            if( response !== 1) {
                return res
                    .status(404)
                    .json(error({requestId: req.id, code: 404}));
            }
            next();     
        });
        

    });
};

module.exports =  verifyAccount;