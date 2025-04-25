import { api, atom } from '@zedux/react';

import { injectLocalStorage } from './local-storage.ts';

export const layoutAtom = atom('layout', () => {
  const signal = injectLocalStorage({
    key: 'layout',
    persistKeys: ['sidebarCollapsed'],
    defaultVal: {
      sidebarCollapsed: true,
      sidebarWidth: 0,
      canvasHasHeader: false,
    },
  });

  return api(signal).setExports({
    setSidebarWidth: (value: number) => signal.mutate({ sidebarWidth: value }),

    setSidebarCollapsed: (value: boolean) => signal.mutate({ sidebarCollapsed: value }),

    setCanvasHasHeader: (value: boolean) => signal.mutate({ canvasHasHeader: value }),
  });
});
