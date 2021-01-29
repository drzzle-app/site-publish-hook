module.exports = {
  root: true,
  extends: 'airbnb-base',
  'globals': {},
  'rules': {
    'global-require': 0,
    'import/no-unresolved': 0,
    'no-console': 0,
    'no-param-reassign': [
      'error', {
        'props': true,
        'ignorePropertyModificationsFor': ['$']
      }
    ],
    'no-bitwise': [
      'error', {
        'allow': ['~']
      }
    ],
    'no-restricted-syntax': [
      'error',
      'WithStatement',
    ],
    'no-plusplus': [
      'error', {
        'allowForLoopAfterthoughts': true
      }
    ],
    'no-param-reassign': [
      'error',
      {
        'props': false
      }
    ],
    'no-shadow': 0,
    'import/extensions': 0,
    'import/newline-after-import': 0,
    'no-multi-assign': 0,
    'no-underscore-dangle': 0,
    'import/no-extraneous-dependencies': [
      'error', {
        'devDependencies': true
      }
    ],
    'prefer-destructuring': [
      'error', {
        'object': false,
        'array': false
      }
    ],
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  }
}
