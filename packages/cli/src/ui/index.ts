import { render as inkRender } from 'ink';
import React from 'react';

import App from './app.tsx';

export function render() {
  const node = React.createElement(App);
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
