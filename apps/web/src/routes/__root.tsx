import '../assets/app.css';

import { Button, Heading } from '@libs/ui-primitives';
import { createRootRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

import { LoginForm } from '~/components/LoginForm.tsx';
import { RegisterForm } from '~/components/RegisterForm.tsx';
import { signOut, useSession } from '~/libs/auth.ts';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useReactScan();

  if (isFirefox()) {
    return <BrowserNotSupported />;
  }

  return <TempAuthDebug />;
}

const TempAuthDebug = () => {
  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = useSession();

  let content: React.ReactNode = null;

  if (isPending) {
    content = <div>Loading...</div>;
  } else if (error) {
    content = <div>Auth error: {error.message}</div>;
  } else if (session) {
    content = (
      <div className="flex flex-col gap-6">
        <div>Signed in as {session.user.email}</div>
        <Button onClick={() => signOut()}>Sign out</Button>
      </div>
    );
  } else {
    content = (
      <>
        <div className="flex flex-col gap-4">
          <Heading size={5}>Sign Up</Heading>
          <RegisterForm />
        </div>

        <div className="flex flex-col gap-4">
          <Heading size={5}>Log In</Heading>
          <LoginForm />
        </div>
      </>
    );
  }

  return <div className="flex gap-20 p-20">{content}</div>;
};

const isFirefox = () => {
  return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
};

const BrowserNotSupported = () => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4">
      <div>
        Firefox is currently not supported. Please use Safari, Edge, or a Chromium based browser (Chrome, Arc, etc).
      </div>

      <div>
        For the technically curious among you, Firefox should work once{' '}
        <a className="text-[blue]" href="https://bugzilla.mozilla.org/show_bug.cgi?id=1951206" target="_blank">
          this bug
        </a>{' '}
        is resolved.
      </div>
    </div>
  );
};

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
