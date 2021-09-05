// lint-staged.config.js

// const { lintStagedBaseConfig } = require('@level-up/utilities');

module.exports = {
  'src/**/*.{js,ts,json}': ['npm run prettify'],
};
