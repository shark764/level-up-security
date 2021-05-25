const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const {errorObj} = require('../../utils/response');
const {MIN_PASSWORD_LENGTH} = require('../../utils/consts');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw(errorObj(401));
            }
        }
    },
    password: {
        type: String,        
        required: false,
    },
    businessName: {
        type: String,
        //required: false,
        trim: true
    },
    firstName: {
        type: String,
        required: false,
        trim: true
    },
    lastName: {
        type: String,
        required: false,
        trim: true
    },
    displayName: {
        type: String,
        required: false,
        trim: true
    }, 
    providerId: {
        type: String,
        trim: true
    },
    provider: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        default: 'Customer',
        trim: true
    },
    active: {
        type: Boolean,
        default: false
    }
});


// hash the plain password before saving
userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        if(user.password && user.password.length < 5) {throw(errorObj(400, MIN_PASSWORD_LENGTH));}
        (user.password != null) ? user.password = await bcrypt.hash(user.password, 8) : user.password;
    }

    next();    
});

// find user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
   

    if (!user) {
        throw(errorObj(401));
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {

        throw(errorObj(401));
    }

    return user;
};


userSchema.statics.newUser =  function (data) {        
    return new Promise((resolve, reject) => {
        const {email, password} = data;
        if (!email || !password) {reject({statusCode: 400});}
         User.findOne(
                { email }).then(user=>{
                    if (user) {
                       return reject({statusCode: 409});
                      }
                      const userToCreate = new User(data);         
                    userToCreate.save(userToCreate).then(userSaved=> resolve(userSaved)).catch(e=> reject(e));
                      
                });
    
     
      });    
};

userSchema.statics.updatePassword =  function (user, newpassword) {
    return new Promise((resolve, reject) => {
        user.password = newpassword;
        user.save().then(userSaved=> resolve(userSaved)).catch(error=> reject(error));
    });
};

const User = mongoose.model('User', userSchema);

module.exports = User;