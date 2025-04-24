/* eslint-disable react-hooks/rules-of-hooks */
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Select, type SelectProps } from './select.tsx';
import { SelectGroup } from './select-group.tsx';
import { SelectItem } from './select-item.tsx';

const meta = {
  title: 'Components / Select',
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof Select>;

export const Basic: Story = {
  render: args => (
    <Select {...args} label="NFL Team">
      <SelectItem value="Cardinals" />
      <SelectItem value="Ravens" />
      <SelectItem value="Cowboys" />
      <SelectItem value="Dolphins" />
      <SelectItem value="Broncos" />
    </Select>
  ),
};

export const DisabledItems: Story = {
  render: args => (
    <Select {...args} label="NFL Team">
      <SelectItem value="Cardinals" />
      <SelectItem value="Ravens" disabled />
      <SelectItem value="Cowboys" />
      <SelectItem value="Dolphins" />
      <SelectItem value="Broncos" />
    </Select>
  ),
};

export const Sections: Story = {
  render: args => (
    <Select {...args} label="NFL Team">
      <SelectItem value="all">All Teams</SelectItem>
      <SelectItem value="none">No Team</SelectItem>

      <SelectGroup title="ACF East">
        <SelectItem value="bills">Buffalo Bills</SelectItem>
        <SelectItem value="dolphins">Miami Dolphins</SelectItem>
        <SelectItem value="patriots">New England Patriots</SelectItem>
        <SelectItem value="jets">New York Jets</SelectItem>
      </SelectGroup>

      <SelectGroup title="NFC North">
        <SelectItem value="bears">Chicago Bears</SelectItem>
        <SelectItem value="lions">Detroit Lions</SelectItem>
        <SelectItem value="packers">Green Bay Packers</SelectItem>
        <SelectItem value="vikings">Minnesota Vikings</SelectItem>
      </SelectGroup>

      <SelectGroup title="NFC West">
        <SelectItem value="cardinals">Arizona Cardinals</SelectItem>
        <SelectItem value="rams">Los Angeles Rams</SelectItem>
        <SelectItem value="49ers">San Francisco 49ers</SelectItem>
        <SelectItem value="seahawks">Seattle Seahawks</SelectItem>
      </SelectGroup>
    </Select>
  ),
};

export const Controlled: Story = {
  render: args => {
    const TEAMS = {
      cardinals: 'Arizona Cardinals',
      ravens: 'Baltimore Ravens',
      cowboys: 'Dallas Cowboys',
      dolphins: 'Miami Dolphins',
      broncos: 'Denver Broncos',
    };

    const [value, updateValue] = useState('ravens');

    return (
      <div className="flex flex-col gap-5">
        <div>Selected: {value}</div>
        <div>
          <Select {...args} aria-label="NFL Team" displayValue={TEAMS[value]} value={value} onChange={updateValue}>
            {Object.entries(TEAMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
    );
  },
};

export const InlineText: Story = {
  render: args => (
    <div className="text-lg">
      My favorite team is{' '}
      <Select {...args} renderInline variant="unstyled" className="px-2">
        <SelectItem value="Cardinals" />
        <SelectItem value="Ravens" />
        <SelectItem value="Cowboys" />
        <SelectItem value="Dolphins" />
        <SelectItem value="Broncos" />
      </Select>{' '}
      because they are awesome.
    </div>
  ),
};

export const Performance: Story = {
  render: args => {
    const ITEMS_PER_MENU = 500;

    function buildMenuItems() {
      const items: { name: string }[] = [];
      for (let i = 0; i < ITEMS_PER_MENU; i++) {
        items.push({ name: `item ${i}` });
      }
      return items;
    }

    const items = buildMenuItems();

    return (
      <Select {...args} label="A long list">
        {items.map(item => (
          <SelectItem key={item.name} value={item.name} />
        ))}
      </Select>
    );
  },
};
