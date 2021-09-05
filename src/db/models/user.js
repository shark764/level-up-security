const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { errorObj } = require('../../utils/response');
const { MIN_PASSWORD_LENGTH } = require('../../utils/consts');
const Role = require('./Role');
const userSchema = require('./schemas/User');

// hash the plain password before saving
userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('email') && !validator.isEmail(user.email))
    throw errorObj(400);
  if (user.isModified('email')) user.email = user.email.toLowerCase();
  if (user.isModified('password')) {
    if (user.password && user.password.length < 5) {
      throw errorObj(400, MIN_PASSWORD_LENGTH);
    }
    // eslint-disable-next-line no-unused-expressions
    user.password != null
      ? (user.password = await bcrypt.hash(user.password, 8))
      : user.password;
  }

  next();
});

// find user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email }).populate(
    'role',
    'name permissions _id',
    Role
  );

  if (!user) {
    throw errorObj(401);
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw errorObj(401);
  }

  return user;
};

userSchema.statics.newUser = function (data) {
  return new Promise((resolve, reject) => {
    const { email, password } = data;
    if (!email || !password) {
      reject({ statusCode: 400 });
    }
    const parsedEmail = email.toLowerCase();
    User.findOne({ email: parsedEmail }).then((user) => {
      if (user) {
        return reject({ statusCode: 409 });
      }
      const userToCreate = new User({ ...data, email: parsedEmail });
      userToCreate
        .save(userToCreate)
        .then((userSaved) => resolve(userSaved))
        .catch((e) => reject(e));
    });
  });
};

userSchema.statics.updatePassword = function (user, newpassword) {
  return new Promise((resolve, reject) => {
    user.password = newpassword;
    user
      .save()
      .then((userSaved) => resolve(userSaved))
      .catch((error) => reject(error));
  });
};

const User = mongoose.model('users', userSchema);

module.exports = User;
