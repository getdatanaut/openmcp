import { faLongArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@libs/ui-primitives';
import { Link } from '@tanstack/react-router';

const COPY = {
  login: {
    otherOptions: 'Other login options',
    alt: 'Sign up instead',
  },
  signup: {
    otherOptions: 'Other signup options',
    alt: 'Log in instead',
  },
} as const;

export function Footer({ provider, type }: { provider?: 'email'; type: 'login' | 'signup' }) {
  return (
    <div className="flex items-center gap-3">
      {provider === 'email' ? (
        <Button
          variant="ghost"
          icon={faLongArrowLeft}
          size="sm"
          render={<Link to="." search={prev => ({ ...prev, provider: undefined })} activeOptions={{ exact: true }} />}
        >
          {COPY[type].otherOptions}
        </Button>
      ) : null}

      <Button
        variant="ghost"
        size="sm"
        render={<Link to={type === 'login' ? '/signup' : '/login'} search={prev => prev} />}
      >
        {COPY[type].alt}
      </Button>
    </div>
  );
}
