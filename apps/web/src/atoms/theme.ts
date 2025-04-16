import { PREBUILT_THEMES } from '@libs/ui-primitives';
import { api, atom } from '@zedux/react';

import { injectLocalStorage } from './local-storage.ts';

export const themeAtom = atom('theme', () => {
  const signal = injectLocalStorage('theme', {
    themeId: 'dark',
    fontId: 'mono',
  });

  return api(signal).setExports({
    theme: () => PREBUILT_THEMES.find(theme => theme.id === signal.get().themeId),

    themeClass: () => `theme-${signal.get().themeId}`,

    setThemeId: (id: string) => signal.mutate({ themeId: id }),

    fontClass: () => (signal.get().fontId === 'mono' ? 'font-mono' : 'font-sans'),

    setFontId: (id: string) => signal.mutate({ fontId: id }),
  });
});
