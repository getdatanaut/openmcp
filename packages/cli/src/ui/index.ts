import { render as inkRender } from 'ink';
import React from 'react';

import console from '#libs/console';

import App from './app.tsx';

export function render() {
  const node = React.createElement(App, {
    onCancel() {
      console.error('Operation canceled');
      instance.rerender(node);
      process.exit(1);
    },
  });
  const instance = inkRender(node, {
    exitOnCtrlC: false,
  });
  return {
    unmount: instance.unmount.bind(instance),
    rerender() {
      instance.rerender(node);
    },
  };
}
