import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { Button, Heading, type IconProps } from '@libs/ui-primitives';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useCallback } from 'react';

import { LoginForm } from '~/components/LoginForm.tsx';
import { RegisterForm } from '~/components/RegisterForm.tsx';
import { signIn, signOut, useSession } from '~/libs/auth.ts';

export const Route = createFileRoute('/')({
  component: HomeRoute,
  // beforeLoad: async () => {
  //   throw redirect({
  //     replace: true,
  //     from: Route.id,
  //     to: '/threads',
  //   });
  // },
});

function HomeRoute() {
  return <HomeComponentComponent />;
}

const HomeComponentComponent = () => {
  return <TempAuthDebug />;
};

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
  const handleClick = useCallback(async () => {
    const res = await signIn.social({
      provider,
    });

    console.log('social login res', res);
  }, [provider]);

  return (
    <Button icon={icon} variant="outline" onClick={handleClick}>
      {children}
    </Button>
  );
};
