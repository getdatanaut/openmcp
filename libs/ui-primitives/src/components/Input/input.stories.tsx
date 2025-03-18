import { faEnvelope, faUserAlt } from '@fortawesome/free-solid-svg-icons';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Button } from '../Button/button.tsx';
import { Input } from './input.tsx';

const meta = {
  title: 'Components / Input',
  component: Input,
  argTypes: {
    disabled: {
      control: 'boolean',
      defaultValue: false,
    },
    readOnly: {
      control: 'boolean',
      defaultValue: false,
    },
    size: {
      control: 'select',
      defaultValue: 'md',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof Input>;

export const Variants: Story = {
  args: {
    size: 'md',
    placeholder: 'example@acme.com',
  },
  render: args => (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <div className="w-36 underline">outline (default)</div>
        <Input {...args} />
      </div>

      <div className="flex flex-col gap-5">
        <div className="w-36 underline">ghost</div>
        <Input {...args} variant="ghost" />
      </div>

      <div className="flex flex-col gap-5">
        <div className="w-36 underline">unstyled</div>
        <Input {...args} variant="unstyled" />
      </div>
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    placeholder: 'example@acme.com',
    startIcon: faUserAlt,
    endIcon: faEnvelope,
  },
  render: args => (
    <div className="flex flex-col gap-10">
      <Input {...args} size="sm" />
      <Input {...args} size="md" />
      <Input {...args} size="lg" />
    </div>
  ),
};

export const WithSection: Story = {
  args: {
    placeholder: 'example@acme.com',
  },
  render: args => {
    const [subscribeValue, setSubscribeValue] = useState('');

    return (
      <div className="flex flex-col gap-10">
        <Input
          size="md"
          {...args}
          value={subscribeValue}
          onChange={e => setSubscribeValue(e.target.value)}
          endSectionWidth={85}
          endSection={
            <Button variant="solid" intent={subscribeValue ? 'primary' : 'neutral'} size="xs" input className="mr-2">
              Subscribe
            </Button>
          }
        />

        <Input
          size="md"
          {...args}
          endSectionWidth={55}
          endSection={
            <Button variant="soft" size="xs" input className="mr-2">
              ESC
            </Button>
          }
        />
      </div>
    );
  },
};
