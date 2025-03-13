import {
  faArrowLeft,
  faArrowRight,
  faCaretDown,
  faCode,
  faCog,
  faCopy,
  faLayerGroup,
  faPager,
  faPencil,
  faRocket,
  faSearch,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import type { Meta, StoryObj } from '@storybook/react';

import type { ButtonProps } from './button.tsx';
import { Button } from './button.tsx';
import { ButtonGroup } from './button-group.tsx';
import { CopyButton, type CopyButtonProps } from './copy-button.tsx';

const meta = {
  title: 'Components / Button',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'My Button',
  },
};

export const Variants: Story = {
  args: {
    size: 'md',
    disabled: false,
    isLoading: false,
  },
  render: args => (
    <div className="flex flex-col gap-10">
      <div className="flex gap-5">
        <div className="w-36 underline">solid (default)</div>

        <Button {...args} variant="solid">
          Neutral
        </Button>
        <Button {...args} variant="solid" intent="primary">
          Primary
        </Button>
        <Button {...args} variant="solid" intent="danger">
          Danger
        </Button>
      </div>

      <div className="flex gap-5">
        <div className="w-36 underline">outline</div>

        <Button {...args} variant="outline">
          Neutral
        </Button>
        <Button {...args} variant="outline" intent="primary">
          Primary
        </Button>
        <Button {...args} variant="outline" intent="danger">
          Danger
        </Button>
      </div>

      <div className="flex gap-5">
        <div className="w-36 underline">soft</div>

        <Button {...args} variant="soft">
          Neutral
        </Button>
        <Button {...args} variant="soft" intent="primary">
          Primary
        </Button>
        <Button {...args} variant="soft" intent="danger">
          Danger
        </Button>
      </div>

      <div className="flex gap-5">
        <div className="w-36 underline">ghost</div>

        <Button {...args} variant="ghost">
          Neutral
        </Button>
        <Button {...args} variant="ghost" intent="primary">
          Primary
        </Button>
        <Button {...args} variant="ghost" intent="danger">
          Danger
        </Button>
      </div>
    </div>
  ),
};

export const Sizes = (props: ButtonProps) => {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex gap-8">
        <Button {...props} size="xs">
          Login (xs)
        </Button>
        <Button {...props} size="sm">
          Login (sm)
        </Button>
        <Button {...props} size="md">
          Login (md)
        </Button>
        <Button {...props} size="lg">
          Login (lg)
        </Button>
      </div>
    </div>
  );
};

export const FullWidth = (props: ButtonProps) => {
  return (
    <div className="flex gap-4">
      <div style={{ width: '200px' }}>
        <Button fullWidth {...props}>
          Full width button
        </Button>
      </div>

      <div style={{ width: '130px' }}>
        <Button {...props}>Button with overflow</Button>
      </div>
    </div>
  );
};

export const WithIcons = (props: ButtonProps) => {
  return (
    <div className="flex flex-col gap-6">
      <Button icon={faRocket} {...props}>
        Lift-off!
      </Button>

      <div className="flex gap-4">
        <Button icon={faArrowLeft} variant="outline" {...props}>
          Previous Page
        </Button>
        <Button endIcon={faArrowRight} variant="outline" {...props}>
          Next Page
        </Button>
      </div>

      <div className="flex gap-4">
        <Button icon={faCopy} {...props}>
          Copy
        </Button>
        <Button icon={faSearch} {...props}>
          Search
        </Button>
        <Button icon={faCode} {...props}>
          Code
        </Button>
        <Button icon={faLayerGroup} {...props}>
          Stack It
        </Button>
        <Button endIcon={faArrowRight} {...props}>
          Next Page
        </Button>
        <Button icon={faPager} endIcon={faArrowRight} {...props}>
          Next Page
        </Button>
      </div>

      <div className="flex gap-4">
        <Button icon={faCog} {...props} />
        <Button endIcon={faArrowRight} variant="outline" {...props} />
      </div>
    </div>
  );
};

export const Loading = (props: ButtonProps) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4">
        <Button isLoading {...props}>
          Loading
        </Button>
        <Button isLoading loadingText="Processing">
          Save
        </Button>
      </div>
    </div>
  );
};

export const Copy = (props: CopyButtonProps) => {
  return (
    <div className="flex flex-col gap-6">
      <CopyButton {...props} copyText="Copy button 1" />

      <CopyButton {...props} copyText="Copy button 2">
        Copy
      </CopyButton>

      <CopyButton
        {...props}
        onClick={(_, { copy }) => {
          copy('Copy button 3');
          alert('Also alerting');
        }}
      >
        With click handler
      </CopyButton>
    </div>
  );
};

export const ButtonGroups: Story = {
  args: {
    disabled: false,
  },
  render: args => (
    <div className="flex flex-col gap-6">
      <ButtonGroup intent="primary" {...args}>
        <Button>Save</Button>
        <Button>Publish</Button>
        <Button intent="danger">Cancel</Button>
      </ButtonGroup>

      <ButtonGroup {...args}>
        <Button icon={faPencil} />
        <Button icon={faCog} />
        <Button icon={faStar} />
      </ButtonGroup>

      <ButtonGroup variant="outline" isAttached {...args}>
        <Button>Create Commit</Button>
        <Button icon={faCaretDown} />
      </ButtonGroup>
    </div>
  ),
};
