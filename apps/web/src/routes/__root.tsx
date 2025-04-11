import '../assets/app.css';

import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { Button, Heading, type IconProps } from '@libs/ui-primitives';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useCallback, useEffect } from 'react';

import { LoginForm } from '~/components/LoginForm.tsx';
import { RegisterForm } from '~/components/RegisterForm.tsx';
import { signIn, signOut, useSession } from '~/libs/auth.ts';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useReactScan();

  if (isFirefox()) {
    return <BrowserNotSupported />;
  }

  return <Outlet />;
}

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
