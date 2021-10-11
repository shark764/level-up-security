const User = require('../db/models/user');

const getMe = async (email) => {
  if (!email) {
    return;
  }

  const parsedEmail = email.toLowerCase();
  const user = await User.findOne({ email: parsedEmail });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user._id,
    userName: user.userName,
    nickName: user.nickName,
    email: user.email,
    profilePhoto: user.userProfile.photo,
    coverPhoto: user.userProfile.coverPhoto,
    role: user.role,
    active: user.active,
    lastLoginDate: user.lastLoginDate,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

module.exports = {
  getMe,
};
