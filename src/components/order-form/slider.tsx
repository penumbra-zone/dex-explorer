import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@penumbra-zone/ui/Button';
import { Slider as PenumbraSlider } from '@penumbra-zone/ui/Slider';
import { Text } from '@penumbra-zone/ui/Text';
// import { theme } from '@penumbra-zone/ui/src/PenumbraUIProvider/theme';
import { OrderInput } from './order-input';
import { SegmentedControl } from './segmented-control';
import { ConnectButton } from './connect-button';
import { connectionStore } from '@/shared/state/connection';

export const Slider = observer(() => {
  const { connected } = connectionStore;
  const [sliderValue, setSliderValue] = useState(0);

  return (
    <div className='mb-4'>
      <div className='mb-4'>
        <PenumbraSlider
          min={0}
          max={1000}
          step={100}
          defaultValue={sliderValue}
          showValue={false}
          onChange={setSliderValue}
          focusedOutlineColor='#BA4D14'
          showTrackGaps={true}
          trackGapBackground='#FAFAFA'
          showFill={true}
        />
      </div>
      <div className='flex flex-row items-center justify-between'>
        <Text small color={color => color.text.secondary}>
          Available Balance
        </Text>
        <Text small color={color => color.text.secondary}>
          {sliderValue}
        </Text>
      </div>
    </div>
  );
});
