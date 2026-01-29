// eslint.config.js
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
  js.configs.recommended,

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
      ...typescript.configs.recommended.rules,
      'prettier/prettier': 'error',
      quotes: ['error', 'single', { avoidEscape: true }],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_.*?$',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-alert': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/require-default-props': 'off',
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'import/prefer-default-export': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never',
          tsx: 'never',
        },
      ],
      'react-native/no-unused-styles': 'off',
      'react-native/split-platform-components': 'error',
      'react-native/no-inline-styles': 'off',
      'react-native/no-color-literals': 'error',
      'react-native/no-raw-text': [
        'error',
        {
          skip: ['Text', 'Typography', 'Button', 'Badge'],
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'should', 'has', 'can', 'did', 'will', 'watched'],
        },
      ],
      'arrow-body-style': 'off',
      'react/no-unstable-nested-components': [
        'error',
        {
          allowAsProps: true,
        },
      ],
      '@typescript-eslint/return-await': 'off',
      'no-param-reassign': ['error', { props: false }],
      'import/no-cycle': 'error',
      'import/no-duplicates': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
      'import/no-named-as-default': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/lines-between-class-members': 'off',
      '@typescript-eslint/no-throw-literal': 'off',
      'global-require': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-restricted-globals': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'no-unused-expressions': 'error',
      'no-useless-return': 'error',
      'no-useless-escape': 'error',
      'no-useless-concat': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'no-void': 'error',
      'no-with': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'react/no-array-index-key': 'warn',
      'react/jsx-no-bind': 'off',
      'react/jsx-no-leaked-render': 'error',
      'react/jsx-pascal-case': 'error',
      'react/no-danger': 'error',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': 'error',
      'react/self-closing-comp': 'error',
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
          classes: true,
          variables: false,
          allowNamedExports: false,
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {},
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
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
