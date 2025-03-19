// @ts-check
import { nodeConfig } from '@libs/eslint-config/node';

export default [
  ...nodeConfig,

  {
    files: ['**/*.ts'],
    rules: {
      // TODO(CL): need to figure out how to handle these cloudflare:workers imports and worker-configuration.d.ts
      // It's working fine with typescript, but eslint is not happy
      // https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
      'no-undef': 'off',
      'import/no-unresolved': ['error', { ignore: ['^cloudflare:workers'] }],
    },
  },
];
