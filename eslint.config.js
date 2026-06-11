// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  {
    ignores: ['dist/*'],
  },
  expoConfig,
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
]);
