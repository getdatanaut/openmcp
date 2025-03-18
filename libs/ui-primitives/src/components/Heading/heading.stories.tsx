import type { Meta } from '@storybook/react';

import { Heading } from './heading.tsx';

const meta = {
  title: 'Components / Heading',
  component: Heading,
  parameters: { controls: { sort: 'requiredFirst' } },
} satisfies Meta<typeof Heading>;

export default meta;

export const Sizes = () => (
  <div className="flex flex-col gap-8">
    <Heading size={1} className="border-y border-dashed">
      The quick brown fox jumps over the lazy dog
    </Heading>
    <Heading size={2} className="border-y border-dashed">
      The quick brown fox jumps over the lazy dog
    </Heading>
    <Heading size={3} className="border-y border-dashed">
      The quick brown fox jumps over the lazy dog
    </Heading>
    <Heading size={4} className="border-y border-dashed">
      The quick brown fox jumps over the lazy dog
    </Heading>
    <Heading size={5} className="border-y border-dashed">
      The quick brown fox jumps over the lazy dog
    </Heading>
    <Heading size={6} className="border-y border-dashed">
      The quick brown fox jumps over the lazy dog
    </Heading>
    <Heading size={7} className="border-y border-dashed">
      The quick brown fox jumps over the lazy dog
    </Heading>
    <Heading size={8} className="border-y border-dashed">
      The quick brown fox jumps over the lazy dog
    </Heading>
    <Heading size={9} className="border-y border-dashed">
      The quick brown fox jumps over the lazy dog
    </Heading>
  </div>
);
