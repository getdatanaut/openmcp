import { reactConfig } from '@libs/eslint-config/react';
import pluginRouter from '@tanstack/eslint-plugin-router';

export default [
  ...reactConfig,
  ...pluginRouter.configs['flat/recommended'],
  {
    rules: {
      'react-hooks/exhaustive-deps': ['warn', { additionalHooks: 'useZeroMutation' }],
    },
  },
];
