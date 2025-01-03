import type { Meta, StoryObj } from '@storybook/react';

import { ModelDisplay } from '../ModelDisplay';

const meta = {
  title: 'Commons/Displays/ModelDisplay',
  component: ModelDisplay,
  tags: ['autodocs'],
  args: {
    value: [
      { displayValue: 'forest' },
      { displayValue: 'waterfall' },
      { displayValue: 'boulder' },
    ],
  },
} satisfies Meta<typeof ModelDisplay>;
export default meta;

type Story = StoryObj<typeof meta>;

export const BasicUsage: Story = {};

export const getDisplayValue: Story = {
  args: {
    getDisplayValue: (value) => (
      <span key={value.displayValue} className="bg-red-200">
        {value.displayValue}
      </span>
    ),
  },
};

export const EmptyArrayValue: Story = {
  args: {
    value: [],
  },
};
