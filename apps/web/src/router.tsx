import { createRouter as createTanStackRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen.ts';

export function createRouter() {
  return createTanStackRouter({
    scrollRestoration: true,
    scrollRestorationBehavior: 'auto',
    routeTree,
    defaultPreload: 'intent',
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
