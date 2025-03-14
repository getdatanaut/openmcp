import '../assets/app.css';

import { tn } from '@libs/ui-primitives';
import { createRootRoute, HeadContent, Outlet, retainSearchParams } from '@tanstack/react-router';
import { observer } from 'mobx-react-lite';
import { type ReactNode, useEffect, useMemo } from 'react';
import { z } from 'zod';

import { createRootStore, RootStoreContext, useRootStore } from '~/stores/root.ts';
import { fallback } from '~/utils/routing.ts';
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

const rootSearchSchema = z.object({
  sidebar: fallback(z.enum(['history', 'servers', 'dev', 'settings']), 'history'),
});

export const Route = createRootRoute({
  component: RootComponent,
  validateSearch: rootSearchSchema,
  search: {
    middlewares: [retainSearchParams(['sidebar'])],
  },
});

function RootComponent() {
  useReactScan();

  const rootStore = useMemo(() => createRootStore(), []);

  return (
    <RootStoreContext.Provider value={rootStore}>
      <ThemeProvider>
        <HeadContent />
        <Outlet />
      </ThemeProvider>
    </RootStoreContext.Provider>
  );
}

const ThemeProvider = observer(({ children }: { children: ReactNode }) => {
  const { app } = useRootStore();
  const themeClass = app.theme?.themeClass;

  return <div className={tn(`min-h-screen`, themeClass && `${themeClass} ak-layer-canvas`)}>{children}</div>;
});

let reactScanAdded = false;
const useReactScan = () => {
  useEffect(() => {
    if (!import.meta.env.DEV || reactScanAdded) return;

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/react-scan/dist/auto.global.js';
    script.async = true;
    document.body.appendChild(script);

    reactScanAdded = true;
  }, []);
};
