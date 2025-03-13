import { reactConfig } from '@libs/eslint-config/react';
import storybook from 'eslint-plugin-storybook';

export default [...storybook.configs['flat/recommended'], ...reactConfig];
