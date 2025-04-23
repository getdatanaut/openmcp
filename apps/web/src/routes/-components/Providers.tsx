import { ZeroProvider as BaseZeroProvider } from '@rocicorp/zero/react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { createEcosystem, EcosystemProvider, useAtomInstance, useAtomValue } from '@zedux/react';
import { useMemo } from 'react';

import { authAtom } from '~/atoms/auth.ts';
import { zeroAtom } from '~/atoms/zero.ts';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const ecosystem = useMemo(() => {
    const ecosystem = // for debugging: make the ecosystem globally accessible
      ((globalThis as any).ecosystem = createEcosystem({
        ssr: typeof window === 'undefined',
        context: {
          router,
          queryClient,
        },
      }));

    return ecosystem;
  }, [router, queryClient]);

  return (
    <EcosystemProvider ecosystem={ecosystem}>
      <AuthProvider>
        <ZeroProvider>{children}</ZeroProvider>
      </AuthProvider>
    </EcosystemProvider>
  );
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAtomInstance(authAtom);
  const hasBootstrapped = useAtomValue(auth.exports.hasBootstrapped);

  if (!hasBootstrapped) {
    return <div>Loading...</div>;
  }

  return children;
}

function ZeroProvider({ children }: { children: React.ReactNode }) {
  const zero = useAtomValue(zeroAtom);

  return <BaseZeroProvider zero={zero}>{children}</BaseZeroProvider>;
}
