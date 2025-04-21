import { baseConfig } from '@libs/eslint-config/base';

export default [
  ...baseConfig,

  {
    files: ['src/**/*.ts'],
    rules: {
      'no-console': 'error',
    },
  },
];
