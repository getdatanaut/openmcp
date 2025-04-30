import { faBell } from '@fortawesome/free-solid-svg-icons';
import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../Button/button.tsx';
import { toast } from './toast-fn.tsx';
import { Toaster } from './toaster.tsx';

const meta = {
  title: 'Components / Toast',
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Toaster duration={Infinity} />

      <Button onClick={() => toast('This is a toast')}>Basic</Button>

      <Button onClick={() => toast('This is a toast', { description: 'With a description and an icon', icon: faBell })}>
        With description
      </Button>

      <Button onClick={() => toast.success('This is a success toast')}>Success</Button>

      <Button onClick={() => toast.error('This is a error toast')}>Error</Button>

      <Button
        onClick={() =>
          toast('This is an action toast', {
            action: {
              label: 'Action',
              onClick: () => alert('Action!'),
            },
          })
        }
      >
        With action
      </Button>

      <Button
        onClick={() =>
          toast('This is an action toast', {
            cancel: {
              onClick: ({ dismiss }) => {
                alert('I will dismiss right after this alert');
                dismiss();
              },
            },
          })
        }
      >
        With cancel
      </Button>

      <Button
        onClick={() =>
          toast('This is a toast with no close button', {
            hideCloseButton: true,
          })
        }
      >
        With no close button
      </Button>

      <Button
        onClick={() =>
          toast('This is an action toast', {
            action: {
              label: 'Action',
              onClick: ({ dismiss }) => {
                alert('I will dismiss right after this alert');
                dismiss();
              },
            },
            cancel: {
              onClick: ({ dismiss }) => {
                alert('I will dismiss right after this alert');
                dismiss();
              },
            },
          })
        }
      >
        With action + cancel
      </Button>

      <Button
        onClick={() =>
          toast('Something will happen on auto close', {
            onAutoClose: () => {
              alert('Auto close, boo!');
            },
          })
        }
      >
        On auto close
      </Button>
    </div>
  ),
};
