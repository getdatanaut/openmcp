import { baseConfig } from '@libs/eslint-config/base';

export default [
  ...baseConfig,
  {
    ignores: ['src/schema.gen.ts'],
  },
];
