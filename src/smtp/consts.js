const ACCOUNT_VERIFICATION  = 'Account needs validation';
const PASSWORD_RESET_CODE = 'Password reset code';
const PASSWORD_RESET_BODY = 'Your verification code is :';
const EMAIL_CONFIRMATION_BODY = (code)=> `The confirmation code to validate your account is  : ${code}`;

module.exports={
    ACCOUNT_VERIFICATION,
    PASSWORD_RESET_BODY,
    PASSWORD_RESET_CODE,
    EMAIL_CONFIRMATION_BODY
};