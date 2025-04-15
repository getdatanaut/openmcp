import { betterFetch } from '@better-fetch/fetch';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '@libs/ui-primitives';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/api/auth/callback/$provider')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();

  /**
   * Making the request from the client because top level browser requests
   * skip the CF worker altogether.
   *
   * More info: https://github.com/cloudflare/workers-sdk/issues/8798
   */
  useEffect(() => {
    void betterFetch(window.location.href, {
      method: 'get',
      onSuccess(context) {
        // URL will be the better-auth redirect URL
        const url = new URL(context.response.url);

        const searchParams = new URLSearchParams(url.search);

        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          alert(`Error: ${[error, errorDescription].filter(Boolean).join(' - ')}`);
          void navigate({ to: '/', replace: true });
          return;
        }

        void navigate({ href: `${url.pathname}${url.search}`, replace: true });
      },
      onError(context) {
        console.log('error', context);
        alert('Something went wrong');
        void navigate({ to: '/', replace: true });
      },
    });
  });

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex cursor-default items-center gap-2 rounded-sm border px-3 py-2">
        <Icon icon={faSpinner} spin />
        <div>Logging in...</div>
      </div>
    </div>
  );
}
