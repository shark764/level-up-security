module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-case': [2, 'always', ['lower-case', 'upper-case', 'sentence-case']],
    'subject-case': [
      2,
      'always',
      ['lower-case', 'upper-case', 'sentence-case'],
    ],
  },
};
