// @ts-check
import globals from 'globals';
import { baseConfig } from './base.js';

export const nodeConfig = [
  ...baseConfig,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.es2022,
        ...globals.node,
      },
    },
  },
];
