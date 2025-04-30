import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { type Ref } from 'react';
import { toast as sonnerToast } from 'sonner';

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
      className="ui-toast group relative flex w-[var(--width)] items-center gap-3 px-4 py-3 md:max-w-[364px]"
    >
      {icon ? <Icon icon={icon} /> : null}

      <div className="flex flex-1 flex-col justify-center pr-10">
        <div className="w-full">
          <div className="font-medium">{title}</div>
          {description ? <div className="ak-text/60 text-sm">{description}</div> : null}
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
        <div className="ak-layer-0 absolute -top-2.5 -right-3 rounded-sm border opacity-0 group-hover:opacity-100">
          <Button icon={faTimes} size="xs" variant="ghost" onClick={() => sonnerToast.dismiss(id)} />
        </div>
      ) : null}
    </div>
  );
}
