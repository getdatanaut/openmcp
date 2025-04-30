import { baseConfig } from '@datanaut/eslint-config/base';

export default [
  ...baseConfig,

  {
    files: ['src/**/*.ts'],
    rules: {
      'no-console': 'error',
    },
  },
];
