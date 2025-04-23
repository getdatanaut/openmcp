import { reactConfig } from '@libs/eslint-config/react';

export default [
  ...reactConfig,
  {
    rules: {
      'react-hooks/exhaustive-deps': ['warn', { additionalHooks: 'useZeroMutation' }],
    },
  },
];
