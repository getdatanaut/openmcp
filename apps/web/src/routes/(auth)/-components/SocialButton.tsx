import { Button, type IconProps } from '@libs/ui-primitives';
import { useAtomInstance } from '@zedux/react';
import { useCallback } from 'react';

import { authAtom } from '~/atoms/auth.ts';

export function SocialButton({
  icon,
  provider,
  children,
}: {
  icon: IconProps['icon'];
  provider: 'github';
  children: React.ReactNode;
}) {
  const auth = useAtomInstance(authAtom);

  const handleClick = useCallback(async () => {
    const res = await auth.exports.signIn.social({
      provider,
    });

    console.log('social login res', res);
  }, [auth.exports.signIn, provider]);

  return (
    <Button icon={icon} variant="outline" size="lg" onClick={handleClick} fullWidth>
      {children}
    </Button>
  );
}
