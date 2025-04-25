import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@libs/ui-primitives';
import { Link, Navigate } from '@tanstack/react-router';

import { CanvasLayoutCentered } from '~/components/CanvasLayoutCentered.tsx';
import { useCurrentUser } from '~/hooks/use-current-user.ts';

import { Footer } from './Footer.tsx';
import { SocialButton } from './SocialButton.tsx';

const COPY = {
  login: {
    title: 'Log in to Datanaut',
  },
  signup: {
    title: 'Sign up for Datanaut',
  },
} as const;

export function Canvas({
  authForm,
  provider,
  type,
}: {
  authForm: React.ReactNode;
  provider?: 'email';
  type: 'login' | 'signup';
}) {
  const user = useCurrentUser();
  if (user) {
    return <Navigate to="/mcp" />;
  }

  let contentElem;
  if (provider === 'email') {
    contentElem = authForm;
  } else {
    contentElem = (
      <>
        <SocialButton icon={faGithub} provider="github">
          Continue with Github
        </SocialButton>

        <Button
          icon={faEnvelope}
          variant="outline"
          size="lg"
          fullWidth
          render={<Link to="." search={prev => ({ ...prev, provider: 'email' })} />}
        >
          Continue with Email
        </Button>
      </>
    );
  }

  return (
    <CanvasLayoutCentered title={COPY[type].title} footer={<Footer provider={provider} type={type} />}>
      <div className="flex w-[30rem] flex-1 flex-col gap-4 p-10">{contentElem}</div>
    </CanvasLayoutCentered>
  );
}
