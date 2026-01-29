// eslint.config.js
// Disabled most rules as per user request
const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const reactNative = require('eslint-plugin-react-native');
const prettier = require('eslint-plugin-prettier');
const importPlugin = require('eslint-plugin-import');
const globals = require('globals');

module.exports = [
  // Base configuration
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      prettier,
      import: importPlugin,
    },
    rules: {
      // Disable all strict rules
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'no-undef': 'off',
      'react-native/no-color-literals': 'off',
      'react-native/no-inline-styles': 'off',
      'react-native/no-raw-text': 'off',
      'react/no-unstable-nested-components': 'off',
      'react/function-component-definition': 'off',
      'import/order': 'off',
      '@typescript-eslint/naming-convention': 'off',
      'react-native/split-platform-components': 'off',
      'react/no-array-index-key': 'off',

      // Keep basic prettier formatting if desired, or turn off too
      'prettier/prettier': 'warn',
    },
  },
  {
    ignores: [
      '/dist/*',
      '/app-example/*',
      '/temp/*',
      'node_modules/*',
      'commitlint.config.js',
      'eslint.config.js',
      'scripts/*',
      '.expo/*',
    ],
  },
];
