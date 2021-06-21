module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['airbnb-base', 'prettier', 'plugin:mocha/recommended'],
  plugins: ['mocha'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'mocha/no-skipped-tests': 'error',
    'mocha/no-exclusive-tests': 'error',
    'mocha/no-mocha-arrows': 'off',
    'no-async-promise-executor': 'off',
  },
}
