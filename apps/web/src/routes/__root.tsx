import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router';

import appCss from '~/assets/app.css?url';

export const Route = createRootRouteWithContext<{}>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'OpenMCP',
      },
      {
        name: 'description',
        content: 'Instant MCP servers from any OpenAPI file.',
      },
    ],

    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>

      <body>
        {children}

        <Scripts />
      </body>
    </html>
  );
}
