const User = require('../db/models/user');
const logger = require('../logging/logger');
const redis = require('./redis');
const {error} = require('./response');
const verifyAccount = (req, res, next)  => {
    const {email, code} = req.body;
    if (!email || !code) {
        return res
            .status(400)
            .json(error({requestId: req.id, code: 400}));
    }
    
  
    const key = `{${email}}{VALIDATIONCODE}`;
    redis.getValidationCodeValue(key, async (err, value) => {
        if (err) {
            logger.error(err);

            return res
                    .status(500)
                    .json(error({requestId: req.id, code: 500,message: err.message}));
        }
        if (!value || code !== value) {
            return res
                .status(404)
                .json(error({requestId: req.id, code: 404}));
        }


        const user = await User.findOne({ email });
        user.active = true;
        await user.save();
        redis.removeKey(key, (err) => {
            if(err){
                logger.error(err);
                return res.status(500).json(error({requestId: req.id, code:500, message: err.message}));
            }
           
            next();     
        });
        

    });
};

module.exports =  verifyAccount;