import { reactConfig } from '@datanaut/eslint-config/react';
import pluginRouter from '@tanstack/eslint-plugin-router';

export default [...reactConfig, ...pluginRouter.configs['flat/recommended']];
