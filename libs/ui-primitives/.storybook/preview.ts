import './style.css';

import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  decorators: [
    withThemeByClassName({
      defaultTheme: 'dracula',
      themes: {
        light: 'theme-light',
        dark: 'theme-dark',
        dracula: 'theme-dracula',
        gruvbox: 'theme-gruvbox',
        nord: 'theme-nord',
        onedark: 'theme-onedark',
        material: 'theme-material',
        monokai: 'theme-monokai',
        nightowl: 'theme-nightowl',
        vscode: 'theme-vscode',
      },
    }),
  ],
};

export default preview;
