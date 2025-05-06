import { baseConfig } from '@datanaut/eslint-config/base';

export default [
  ...baseConfig,

  {
    files: ['src/**/*.ts'],
    rules: {
      'no-console': 'error',
      'import/extensions': 'off', // not needed if moduleResolution is set to node16
      'import/no-extraneous-dependencies': 'error',
    },
  },
];
