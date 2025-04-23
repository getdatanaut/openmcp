import { createFileRoute } from '@tanstack/react-router';
import { useAtomInstance } from '@zedux/react';
import { useState } from 'react';

import { authAtom } from '~/atoms/auth.ts';

export const Route = createFileRoute('/auth/consent')({
  component: ConsentPage,
});

function ConsentPage() {
  const navigate = Route.useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const clientId = searchParams.get('client_id');
  const scope = searchParams.get('scope');
  const [error, setError] = useState<string | null>(null);
  const auth = useAtomInstance(authAtom);

  const handleConsent = async () => {
    const res = await auth.exports.oauth2.consent({
      accept: true,
    });
    if (res.error) {
      setError(res.error.message ?? 'Unknown error');
    } else {
      await navigate({ to: res.data.redirectURI, replace: true });
    }
  };

  const handleDeny = async () => {
    await auth.exports.oauth2.consent({
      accept: false,
    });
  };

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 rounded-md border p-6 shadow-md">
          <h1 className="text-2xl font-bold">Error</h1>
          <p className="text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 rounded-md border p-6 shadow-md">
        <h1 className="text-2xl font-bold">Consent Required</h1>
        <p className="text-center">
          {/* @todo: get client name */}
          The application <strong>{clientId}</strong> is requesting access to your account.
        </p>
        {scope && (
          <div className="mt-2">
            <p className="font-semibold">Requested permissions:</p>
            <ul className="list-disc pl-5">
              {scope.split(' ').map(s => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-4 flex gap-4">
          <button onClick={handleDeny} className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300">
            Deny
          </button>
          <button onClick={handleConsent} className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
