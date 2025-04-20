import { betterFetch } from '@better-fetch/fetch';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '@libs/ui-primitives';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/api/auth/oauth2/authorize')({
  component: ApiOauth2Handler,
});

function ApiOauth2Handler() {
  const navigate = Route.useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const currentUrl = window.location.href;

    betterFetch(currentUrl, {
      method: 'get',
      async onSuccess(context) {
        const responseUrl = new URL(context.response.url);
        const searchParams = new URLSearchParams(responseUrl.search);

        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setError(`Error: ${[error, errorDescription].filter(Boolean).join(' - ')}`);
        } else if (context.response.ok) {
          await navigate({ to: responseUrl.pathname, replace: true });
        } else {
          setError('Authorization service responded with an error/');
        }
      },
      onError(context) {
        context.response
          .text()
          .then(txt => {
            setError(txt ?? 'Unknown error');
          })
          .catch(() => {
            setError('Failed to parse error response.');
          });
      },
    })
      .catch(() => {
        setError('Failed to connect to authorization service.');
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, [navigate]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex cursor-default flex-col items-center gap-2 rounded-sm border px-5 py-4">
        {!isLoaded ? <Icon icon={faSpinner} spin /> : null}
        {error !== null ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div>'Connecting to authorization service...</div>
        )}
      </div>
    </div>
  );
}
