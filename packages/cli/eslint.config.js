import { baseConfig } from '@datanaut/eslint-config/base';

export default [
  ...baseConfig,

  {
    files: ['src/**/*.ts'],
    rules: {
      'no-console': 'error',
      'turbo/no-undeclared-env-vars': 'warn',
    },
  },
];
