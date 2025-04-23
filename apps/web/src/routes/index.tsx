import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { Button, Heading, type IconProps } from '@libs/ui-primitives';
import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useAtomInstance, useAtomValue } from '@zedux/react';
import { useCallback } from 'react';

import { authAtom } from '~/atoms/auth.ts';
import { LoginForm } from '~/components/LoginForm.tsx';
import { RegisterForm } from '~/components/RegisterForm.tsx';

export const Route = createFileRoute('/')({
  component: HomeRoute,
});

function HomeRoute() {
  return <HomeComponentComponent />;
}

const HomeComponentComponent = () => {
  return <TempAuthDebug />;
};

const TempAuthDebug = () => {
  const auth = useAtomInstance(authAtom);
  const isBootstrapped = useAtomValue(auth.exports.hasBootstrapped);
  const user = useAtomValue(auth.exports.user);

  let error = false as any;

  let content: React.ReactNode = null;

  if (!isBootstrapped) {
    content = <div>Loading...</div>;
  } else if (error) {
    content = <div>Auth error: {error.message}</div>;
  } else if (user) {
    return <Navigate to="/mcp-servers" />;
  } else {
    content = (
      <>
        <div className="flex flex-col gap-4">
          <Heading size={5}>Sign Up</Heading>

          <RegisterForm />

          <SocialLoginButton icon={faGithub} provider="github">
            Github
          </SocialLoginButton>
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

const SocialLoginButton = ({
  icon,
  provider,
  children,
}: {
  icon: IconProps['icon'];
  provider: 'github';
  children: React.ReactNode;
}) => {
  const auth = useAtomInstance(authAtom);

  const handleClick = useCallback(async () => {
    const res = await auth.exports.signIn.social({
      provider,
    });

    console.log('social login res', res);
  }, [auth.exports.signIn, provider]);

  return (
    <Button icon={icon} variant="outline" onClick={handleClick}>
      {children}
    </Button>
  );
};
