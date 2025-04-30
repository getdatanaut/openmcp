import { baseConfig } from '@datanaut/eslint-config/base';

export default [
  ...baseConfig,
  {
    ignores: ['src/schema.gen.ts'],
  },
];
