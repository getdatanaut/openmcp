import '../assets/app.css';

import { createRootRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useReactScan();

  if (isFirefox()) {
    return <BrowserNotSupported />;
  }

  return <div>Hello</div>;
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
