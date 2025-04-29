import { isDefinedError, ORPCError } from '@orpc/client';
import type { QueryClient } from '@tanstack/react-query';
import { createRouter as baseCreateRouter } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';

import { CanvasLayout } from '~/components/CanvasLayout.tsx';

import { CanvasLayoutCentered } from './components/CanvasLayoutCentered.tsx';
import type { Ecosystem } from './hooks/inject-ecosystem.ts';
import { Providers } from './routes/-components/Providers.tsx';
import { routeTree } from './routeTree.gen.ts';

export function createRouter() {
  return baseCreateRouter({
    routeTree,
    defaultPreload: 'intent',
    context: {
      // We set these when rendering the <RouterProvider /> component
      queryClient: undefined as unknown as QueryClient,
      ecosystem: undefined as unknown as Ecosystem,
    },
    defaultViewTransition: true,
    defaultStructuralSharing: true,
    defaultPreloadDelay: 100,
    defaultPendingComponent: () => {
      return (
        <CanvasLayoutCentered>
          <div className="px-5 py-4">Loading...</div>
        </CanvasLayoutCentered>
      );
    },
    defaultErrorComponent: ({ error }) => {
      // console.error(error);
      let content;
      if (error instanceof ORPCError && isDefinedError(error)) {
        if (error.status === 401) {
          content = <div className="ak-text-danger">You must be logged in to access this page.</div>;
        }
      }

      if (!content) {
        content = <div className="ak-text-danger">An error occurred</div>;
      }

      return (
        <CanvasLayout>
          <div className="flex h-full w-full items-center justify-center">{content}</div>
        </CanvasLayout>
      );
    },
  });
}

const router = createRouter();

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('app')!).render(<Providers router={router} />);
