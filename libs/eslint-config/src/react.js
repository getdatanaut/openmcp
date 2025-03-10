import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

import { baseConfig } from './base.js';

/** @type {import("eslint").Linter.Config[]} */
export const reactConfig = [
  ...baseConfig,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      formComponents: ['Form'],
      linkComponents: [
        { name: 'Link', linkAttribute: 'to' },
        { name: 'NavLink', linkAttribute: 'to' },
      ],
    },
    rules: {
      'react/prop-types': 'off',
    },
  },
];
