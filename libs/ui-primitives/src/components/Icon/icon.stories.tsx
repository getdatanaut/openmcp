import { faHouse } from '@fortawesome/free-solid-svg-icons';
import type { Meta, StoryObj } from '@storybook/react';

import { Icon } from './icon.tsx';

const meta = {
  title: 'Components / Icon',
  component: Icon,
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: faHouse,
  },
};
