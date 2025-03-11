import '../assets/app.css';

import { createRootRoute, HeadContent, Outlet, retainSearchParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import { z } from 'zod';

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

  return (
    <>
      <HeadContent />
      <Outlet />
    </>
  );
}

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
