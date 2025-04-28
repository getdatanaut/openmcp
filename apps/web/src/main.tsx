import { isDefinedError, ORPCError } from '@orpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter as baseCreateRouter, RouterProvider } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';

import { CanvasLayout } from '~/components/CanvasLayout.tsx';

import { routeTree } from './routeTree.gen.ts';

export function createRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 30,
      },
    },
  });

  return {
    queryClient,
    router: baseCreateRouter({
      routeTree,
      defaultPreload: 'intent',
      context: { queryClient },
      defaultViewTransition: true,
      defaultStructuralSharing: true,
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
    }),
  };
}

const { queryClient, router } = createRouter();

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
