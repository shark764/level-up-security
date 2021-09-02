const { eslintBaseConfig } = require('@level-up/utilities');

eslintBaseConfig.rules = {
  ...eslintBaseConfig.rules,
  'consistent-return': 'off',
  'no-underscore-dangle': 'off',
  'prefer-promise-reject-errors': 'warn',
  'prettier/prettier': 'error',
};

module.exports = eslintBaseConfig;
