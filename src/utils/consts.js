const DEV_MODE = !process.env.PORT;
const EMAIL_CONFIRMATION =
  'LUL-SEC003 - Email is missing verification, please confirm email.';
const PASSWORD_DOES_NOT_MATCH =
  'LUL-SEC022 - Current password does not match with input password.';
const PASSWORD_CHANGE_CANT_BE_SAME =
  'LUL-SEC022 New password cannot be the same as current password.';
const MIN_PASSWORD_LENGTH =
  'LUL-SEC000 Make sure password minimun length is 5 characters.';

module.exports = {
  DEV_MODE,
  EMAIL_CONFIRMATION,
  PASSWORD_CHANGE_CANT_BE_SAME,
  PASSWORD_DOES_NOT_MATCH,
  MIN_PASSWORD_LENGTH,
};
