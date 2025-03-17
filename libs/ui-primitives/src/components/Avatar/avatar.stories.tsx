import { faCube, faPlus, faRocket, faUserAlt } from '@fortawesome/free-solid-svg-icons';
import type { Meta } from '@storybook/react';

import { Avatar } from './avatar.tsx';

const meta = {
  title: 'Components / Avatar',
  component: Avatar,
  parameters: { controls: { sort: 'requiredFirst' } },
} satisfies Meta<typeof Avatar>;

export default meta;

const avatarUrl = 'https://bit.ly/dan-abramov';

export const Basic = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Avatar src={avatarUrl} name="Dan" />

      <Avatar name="Dan" />
    </div>
  ),
};

export const Sizes = {
  render: () => {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex gap-4">
          <Avatar src={avatarUrl} name="John" size="2xl" />
          <Avatar src={avatarUrl} name="John" size="xl" />
          <Avatar src={avatarUrl} name="John" size="lg" />
          <Avatar src={avatarUrl} name="John" size="md" />
          <Avatar src={avatarUrl} name="John" size="sm" />
        </div>

        <div className="flex gap-3">
          <Avatar name="John" size="2xl" />
          <Avatar name="John" size="xl" />
          <Avatar name="John" size="lg" />
          <Avatar name="John" size="md" />
          <Avatar name="John" size="sm" />
        </div>

        <div className="flex gap-3">
          <Avatar name="John" size="2xl" className="rounded-full" />
          <Avatar name="Sam" size="xl" className="rounded-full" />
          <Avatar name="Marc" size="lg" className="rounded-full" />
          <Avatar name="Jack" size="md" className="rounded-full" />
          <Avatar name="Chris" size="sm" className="rounded-full" />
        </div>
      </div>
    );
  },
};

export const Icons = {
  render: () => {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex gap-3">
          <Avatar icon={faUserAlt} size="2xl" className="rounded-full" />
          <Avatar icon={faRocket} size="xl" className="rounded-full" />
          <Avatar icon={faCube} size="lg" className="rounded-full" />
          <Avatar icon={faPlus} size="md" className="rounded-full" />
          <Avatar icon={faPlus} size="sm" className="rounded-full" />
        </div>
      </div>
    );
  },
};

export const Fallback = {
  render: () => {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex gap-3">
          <Avatar name="Sally" size="2xl" src="https://bit.ly/broken-link" />
        </div>
      </div>
    );
  },
};
