// Flat ESLint config. `expo lint` runs this.
// eslint-config-expo covers React Native / Expo rules; eslint-config-prettier
// turns off formatting rules so Prettier is the single source of truth for style.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
]);
