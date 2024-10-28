import { useState } from 'react';
import penumbraTheme from './penumbraTheme';
import { ConditionalWrap } from '../src/shared/ui/ConditionalWrap';
import { PenumbraUIProvider } from '../src/shared/ui/PenumbraUIProvider';
import { Density } from '../src/shared/ui/Density';
import { Tabs } from '../src/shared/ui/Tabs';
import { styled } from 'styled-components';
import '../app/v2.css';

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing(8)};
`;

/**
 * Utility component to let users control the density, for components whose
 * stories include the `density` tag.
 */
const DensityWrapper = ({ children, showDensityControl }) => {
  const [density, setDensity] = useState('sparse');

  return (
    <ConditionalWrap
      if={density === 'sparse'}
      then={children => <Density sparse>{children}</Density>}
      else={children => <Density compact>{children}</Density>}
    >
      <Column>
        {showDensityControl && (
          <Density sparse>
            <Tabs
              options={[
                { label: 'Sparse', value: 'sparse' },
                { label: 'Compact', value: 'compact' },
              ]}
              value={density}
              onChange={setDensity}
            />
          </Density>
        )}

        {children}
      </Column>
    </ConditionalWrap>
  );
};

/** @type { import('@storybook/react').Preview } */
const preview = {
  decorators: [
    (Story, { tags }) => {
      return (
        <PenumbraUIProvider>
          <DensityWrapper showDensityControl={tags.includes('density')}>
            <Story />
          </DensityWrapper>
        </PenumbraUIProvider>
      );
    },
  ],
  argTypes: {
    // The `motion` prop is used throughout many Penumbra UI components for
    // framer-motion settings, and shouldn't be controlled in Storybook.
    motion: { control: false },
  },
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      theme: penumbraTheme,
    },
  },
};

export default preview;
