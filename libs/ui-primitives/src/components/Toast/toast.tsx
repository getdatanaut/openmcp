import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { type Ref } from 'react';
import { toast as sonnerToast } from 'sonner';

import { tn } from '../../utils/tw.ts';
import { Button } from '../Button/button.tsx';
import { Icon, type IconProps } from '../Icon/icon.tsx';

export interface ToastCompProps {
  id: string | number;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: IconProps['icon'];
  action?: {
    label: string;
    onClick: ({ dismiss }: { dismiss: () => void }) => void;
  };
  cancel?: {
    label?: string;
    onClick: ({ dismiss }: { dismiss: () => void }) => void;
  };
  hideCloseButton?: boolean;
  ref?: Ref<HTMLDivElement>;
}

export function Toast({ ref, id, title, description, icon, action, cancel, hideCloseButton }: ToastCompProps) {
  return (
    <div
      ref={ref}
      className="ui-toast group relative flex w-[var(--width)] items-center gap-2 px-6 py-5 md:max-w-[364px]"
    >
      {icon ? <Icon icon={icon} className="mr-2.5" /> : null}

      <div className="flex flex-1 flex-col justify-center">
        <div className="w-full">
          <div className={tn(description && 'font-medium')}>{title}</div>
          {description ? <div className="ak-text/60">{description}</div> : null}
        </div>
      </div>

      {action ? (
        <Button
          size="sm"
          onClick={() => {
            action.onClick({ dismiss: () => sonnerToast.dismiss(id) });
          }}
        >
          {action.label}
        </Button>
      ) : null}

      {cancel ? (
        <Button
          size="sm"
          variant="soft"
          onClick={() => {
            if (cancel.onClick) {
              cancel.onClick({ dismiss: () => sonnerToast.dismiss(id) });
            } else {
              sonnerToast.dismiss(id);
            }
          }}
        >
          {cancel.label ?? 'Cancel'}
        </Button>
      ) : null}

      {!hideCloseButton ? (
        <Button
          icon={faTimes}
          size="xs"
          variant="unstyled"
          onClick={() => sonnerToast.dismiss(id)}
          className="ak-layer-0 absolute top-0.5 right-0.5 flex h-5 w-5 translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border"
        />
      ) : null}
    </div>
  );
}
